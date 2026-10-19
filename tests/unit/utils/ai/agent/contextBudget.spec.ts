import { expect } from 'chai'
import type { ModelMessage } from 'ai'
import { AgentMessage } from '@/types/agent'
import {
  COMPACT_THRESHOLD,
  KEEP_RECENT_TURNS,
  compactHistory,
  contextPercent,
  estimateTokens,
  fitToBudget,
  formatTokens,
  getContextWindow,
  isContextOverflowError,
  olderMessages,
  readImageForEstimate,
  shouldCompact,
  trimToolResults,
} from '@/utils/ai/agent/contextBudget'
import { toModelMessages } from '@/utils/ai/agent/messageParts'

const user = (id: string, content = 'hello'): AgentMessage => ({ id, role: 'user', content })
const assistant = (id: string, content = 'hi'): AgentMessage => ({ id, role: 'assistant', content })

/** The content parts of every message, for the assertions below */
const partsOf = (messages: ModelMessage[]): Array<Record<string, any>> =>
  messages.flatMap((message) =>
    typeof message.content === 'string' ? [] : (message.content as unknown as Array<Record<string, any>>),
  )

const resultValues = (messages: ModelMessage[]): any[] =>
  partsOf(messages)
    .filter((part) => part.type === 'tool-result')
    .map((part) => part.output?.value)

const toolMessages = (results: number): ModelMessage[] => {
  const messages: ModelMessage[] = []
  for (let index = 0; index < results; index += 1) {
    messages.push({
      role: 'assistant',
      content: [{ type: 'tool-call', toolCallId: `c${index}`, toolName: 'list_connections', input: { index } }],
    })
    messages.push({
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: `c${index}`,
          toolName: 'list_connections',
          output: { type: 'json', value: { index, payload: 'x'.repeat(400) } },
        },
      ],
    })
  }
  return messages
}

describe('agent context budget', () => {
  describe('estimateTokens', () => {
    it('should count about four latin characters per token', () => {
      expect(estimateTokens('')).to.equal(0)
      expect(estimateTokens('hello world')).to.equal(3)
      expect(estimateTokens('x'.repeat(400))).to.equal(100)
    })

    it('should count every CJK character as one token', () => {
      expect(estimateTokens('你好世界')).to.equal(4)
      expect(estimateTokens('温度传感器')).to.equal(5)
    })

    it('should mix both rules', () => {
      // "hi 你好" is 5 characters, 2 of them CJK
      expect(estimateTokens('hi 你好')).to.equal(3)
    })

    it('should count a fixed block per image', () => {
      const messages: ModelMessage[] = [
        { role: 'user', content: [{ type: 'image', image: 'data:image/png;base64,AAAA', mediaType: 'image/png' }] },
      ]
      expect(estimateTokens(messages)).to.equal(1000)
    })

    it('should count tool calls and results by their JSON length', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'publish', input: { topic: 'a/b' } }],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'c1',
              toolName: 'publish',
              output: { type: 'text', value: 'x'.repeat(80) },
            },
          ],
        },
      ]
      const total = estimateTokens(messages)
      expect(total).to.be.greaterThan(20)
      expect(total).to.be.lessThan(60)
    })

    it('should count an attached image without reading its bytes', () => {
      const messages: AgentMessage[] = [
        {
          id: 'u1',
          role: 'user',
          content: 'look at this',
          parts: [
            {
              type: 'attachment',
              kind: 'image',
              name: 'sensor.png',
              size: 2048,
              mediaType: 'image/png',
              relativePath: 'conv/sensor.png',
            },
          ],
        },
      ]

      expect(estimateTokens(toModelMessages(messages, readImageForEstimate))).to.equal(
        1000 + estimateTokens('look at this'),
      )
    })

    it('should count the parts of a message separately', () => {
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'a'.repeat(40) },
            { type: 'text', text: 'b'.repeat(40) },
          ],
        },
      ]
      expect(estimateTokens(messages)).to.equal(20)
    })
  })

  describe('formatTokens', () => {
    it('should print counts below a thousand as they are', () => {
      expect(formatTokens(0)).to.equal('0')
      expect(formatTokens(950)).to.equal('950')
      expect(formatTokens(999)).to.equal('999')
    })

    it('should keep one decimal below ten thousand', () => {
      expect(formatTokens(1000)).to.equal('1.0k')
      expect(formatTokens(9900)).to.equal('9.9k')
      // Rounding up to ten thousand switches to whole thousands instead of printing 10.0k
      expect(formatTokens(9999)).to.equal('10k')
    })

    it('should round the thousands from ten thousand up', () => {
      expect(formatTokens(12345)).to.equal('12k')
      expect(formatTokens(128000)).to.equal('128k')
    })

    it('should use millions with one decimal', () => {
      expect(formatTokens(1048576)).to.equal('1.0M')
      expect(formatTokens(2500000)).to.equal('2.5M')
    })
  })

  describe('contextPercent', () => {
    it('should round the share of the window', () => {
      expect(contextPercent(0, 128000)).to.equal(0)
      expect(contextPercent(45000, 128000)).to.equal(35)
      expect(contextPercent(128000, 128000)).to.equal(100)
    })

    it('should cap at 100 when the count is over the window', () => {
      expect(contextPercent(200000, 128000)).to.equal(100)
      expect(contextPercent(1048576, 400000)).to.equal(100)
    })

    it('should stay at 0 without a usable window', () => {
      expect(contextPercent(45000, 0)).to.equal(0)
    })
  })

  describe('getContextWindow', () => {
    it('should use the window of the model in the model list', () => {
      expect(getContextWindow('gpt-5.2')).to.equal(400000)
      expect(getContextWindow('gpt-4o-mini')).to.equal(128000)
      expect(getContextWindow('deepseek-flash')).to.equal(1000000)
      expect(getContextWindow('claude-sonnet-4-6')).to.equal(1000000)
      expect(getContextWindow('gemini-2.5-pro')).to.equal(1048576)
      // Azure deployments, with and without the prefix the agent strips
      expect(getContextWindow('deployment-gpt-5')).to.equal(400000)
      expect(getContextWindow('gpt-5')).to.equal(400000)
    })

    it('should default to 128000 for custom models and listed models without a known window', () => {
      expect(getContextWindow('my-custom-model')).to.equal(128000)
      expect(getContextWindow('moonshot-v1-128k')).to.equal(128000)
    })
  })

  describe('shouldCompact', () => {
    it('should compact over the threshold when there are older messages', () => {
      expect(shouldCompact({ estimate: 800, window: 1000, olderMessageCount: 4 })).to.equal(true)
      expect(shouldCompact({ estimate: 1000 * COMPACT_THRESHOLD - 1, window: 1000, olderMessageCount: 2 })).to.equal(
        false,
      )
      expect(shouldCompact({ estimate: 1000 * COMPACT_THRESHOLD + 1, window: 1000, olderMessageCount: 2 })).to.equal(
        true,
      )
    })

    it('should not compact when the kept turns are all there is', () => {
      expect(shouldCompact({ estimate: 10000, window: 1000, olderMessageCount: 1 })).to.equal(false)
      expect(shouldCompact({ estimate: 10000, window: 1000, olderMessageCount: 0 })).to.equal(false)
    })
  })

  describe('olderMessages', () => {
    it('should keep the last keepTurns turns out of the older part', () => {
      const messages: AgentMessage[] = []
      for (let turn = 1; turn <= 6; turn += 1) {
        messages.push(user(`u${turn}`), assistant(`a${turn}`))
      }
      const older = olderMessages(messages)

      expect(older).to.have.length(messages.length - KEEP_RECENT_TURNS * 2)
      expect(older[older.length - 1].id).to.equal('a2')
    })

    it('should treat everything as older when there are fewer turns than kept', () => {
      expect(olderMessages([user('u1'), assistant('a1')])).to.have.length(0)
    })
  })

  describe('trimToolResults', () => {
    it('should replace only the results older than the last three', () => {
      const trimmed = trimToolResults(toolMessages(5))
      const omitted = resultValues(trimmed).filter((value) => typeof value === 'string' && value.includes('omitted'))

      expect(omitted).to.have.length(2)
      expect(omitted[0]).to.contain('Call the tool again if you need it.')
      expect(omitted[0]).to.contain('KB')
    })

    it('should keep every tool call paired with its result', () => {
      const trimmed = trimToolResults(toolMessages(4))
      const calls = partsOf(trimmed)
        .filter((part) => part.type === 'tool-call')
        .map((part) => part.toolCallId)
      const results = partsOf(trimmed)
        .filter((part) => part.type === 'tool-result')
        .map((part) => part.toolCallId)

      expect(calls).to.deep.equal(['c0', 'c1', 'c2', 'c3'])
      expect(results).to.deep.equal(calls)
    })

    it('should drop reasoning except in the last message', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            { type: 'reasoning', text: 'thinking' },
            { type: 'text', text: 'one' },
          ],
        },
        {
          role: 'assistant',
          content: [
            { type: 'reasoning', text: 'more' },
            { type: 'text', text: 'two' },
          ],
        },
      ]
      const reasoning = partsOf(trimToolResults(messages)).filter((part) => part.type === 'reasoning')

      expect(reasoning).to.have.length(1)
      expect(reasoning[0].text).to.equal('more')
    })

    it('should not change a conversation that has nothing to trim', () => {
      const messages: ModelMessage[] = [{ role: 'user', content: 'hello' }]
      expect(trimToolResults(messages)).to.deep.equal(messages)
    })
  })

  describe('isContextOverflowError', () => {
    it('should recognise the provider messages', () => {
      const messages = [
        "This model's maximum context length is 128000 tokens.",
        'context_length_exceeded',
        'This request exceeds the maximum number of tokens allowed',
        'The prompt is too long for this model',
        'Input is too long.',
        'Please reduce the length of the messages',
        'maximum context window reached',
        'Too many tokens in the request',
      ]
      for (const message of messages) {
        expect(isContextOverflowError(new Error(message)), message).to.equal(true)
      }
    })

    it('should read the response body of an API error', () => {
      const error = Object.assign(new Error('Bad Request'), {
        responseBody: '{"error":{"message":"maximum context length exceeded"}}',
      })
      expect(isContextOverflowError(error)).to.equal(true)
      expect(isContextOverflowError('prompt is too long')).to.equal(true)
    })

    it('should ignore unrelated errors', () => {
      expect(isContextOverflowError(new Error('Invalid API key'))).to.equal(false)
      expect(isContextOverflowError(new Error('429 rate limit reached'))).to.equal(false)
      expect(isContextOverflowError(undefined)).to.equal(false)
    })
  })

  describe('compactHistory', () => {
    const window = 1000
    // Every message is about 100 estimated tokens, so a few turns already pass the threshold
    const turns = (count: number, suffix = ''): AgentMessage[] => {
      const messages: AgentMessage[] = []
      for (let turn = 1; turn <= count; turn += 1) {
        const createAt = `2026-01-01 00:00:${suffix}${String(turn).padStart(2, '0')}`
        messages.push(
          { ...user(`u${turn}${suffix}`, 'x'.repeat(400)), createAt },
          { ...assistant(`a${turn}${suffix}`, 'y'.repeat(400)), createAt },
        )
      }
      return messages
    }

    it('should leave a short conversation alone and not summarize', async () => {
      let called = 0
      const messages = turns(2)
      const result = await compactHistory({
        messages,
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async () => {
          called += 1
          return 'summary'
        },
      })

      expect(called).to.equal(0)
      expect(result.messages).to.equal(messages)
      expect(result.fitted).to.equal(false)
      expect(result.marker).to.equal(undefined)
    })

    it('should summarize the older turns and add a marker that covers them', async () => {
      const seen: AgentMessage[][] = []
      const messages = turns(8)
      const result = await compactHistory({
        messages,
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async (older) => {
          seen.push(older)
          return 'the summary'
        },
      })

      expect(seen).to.have.length(1)
      expect(seen[0][0].id).to.equal('u1')
      expect(seen[0][seen[0].length - 1].id).to.equal('a4')
      expect(result.fitted).to.equal(false)

      const marker = result.marker!
      expect(marker.role).to.equal('system')
      expect(marker.content).to.equal('the summary')
      expect(marker.conversationId).to.equal('conv')
      // The marker sorts right after the last message it covers
      expect(marker.createAt).to.equal(messages[7].createAt)
      const part = (marker.parts ?? [])[0] as any
      expect(part.type).to.equal('compaction')
      expect(part.untilMessageId).to.equal('a4')
      expect(part.messageCount).to.equal(8)
      expect(result.messages[result.messages.length - 1]).to.equal(marker)
    })

    it('should fold the previous summary and the newer turns into a new marker', async () => {
      const previous = turns(8)
      const withMarker = await compactHistory({
        messages: previous,
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async () => 'first summary',
      })
      const next = [...withMarker.messages, ...turns(6, 'b')]

      let previousSummary: string | undefined
      const result = await compactHistory({
        messages: next,
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async (older, summary) => {
          previousSummary = summary
          expect(older.some((message) => message.id === withMarker.marker!.id)).to.equal(false)
          return 'second summary'
        },
      })

      expect(previousSummary).to.equal('first summary')
      expect(result.marker?.content).to.equal('second summary')
    })

    it('should fall back to the newest messages that fit when the summary fails', async () => {
      const messages = turns(8)
      const result = await compactHistory({
        messages,
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async () => null,
      })

      expect(result.fitted).to.equal(true)
      expect(result.marker).to.equal(undefined)
      expect(result.messages.length).to.be.greaterThan(0)
      expect(result.messages.length).to.be.lessThan(messages.length)
      // The newest turn is always kept
      expect(result.messages[result.messages.length - 1].id).to.equal('a8')
    })

    it('should keep the previous marker when a later summary fails', async () => {
      const first = await compactHistory({
        messages: turns(8),
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async () => 'first summary',
      })
      const next = [...first.messages, ...turns(6, 'c')]
      const result = await compactHistory({
        messages: next,
        conversationId: 'conv',
        window,
        systemTokens: 0,
        summarize: async () => null,
      })

      expect(result.fitted).to.equal(true)
      expect(result.messages[0]).to.equal(first.marker)
    })

    it('should compact on demand even when the estimate is under the threshold', async () => {
      let called = 0
      const messages = turns(5)
      const result = await compactHistory({
        messages,
        conversationId: 'conv',
        window: 1000000,
        systemTokens: 0,
        force: true,
        summarize: async () => {
          called += 1
          return 'forced summary'
        },
      })

      expect(called).to.equal(1)
      expect(result.marker?.content).to.equal('forced summary')
    })
  })

  describe('fitToBudget', () => {
    it('should keep the newest messages that fit', () => {
      const messages = turnsForFit()
      const kept = fitToBudget(messages, 12, 0)
      expect(kept.length).to.be.greaterThan(0)
      expect(kept.length).to.be.lessThan(messages.length)
      expect(kept[kept.length - 1].id).to.equal('a3')
    })
  })
})

function turnsForFit(): AgentMessage[] {
  const messages: AgentMessage[] = []
  for (let turn = 1; turn <= 3; turn += 1) {
    messages.push(user(`u${turn}`, 'x'.repeat(40)), assistant(`a${turn}`, 'y'.repeat(40)))
  }
  return messages
}
