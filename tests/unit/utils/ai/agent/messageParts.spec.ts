import { expect } from 'chai'
import {
  applyStreamPart,
  approveToolPart,
  getPartsText,
  setToolState,
  stopParts,
  toModelMessages,
} from '@/utils/ai/agent/messageParts'
import { AgentMessagePart } from '@/types/agent'

describe('messageParts', () => {
  describe('applyStreamPart', () => {
    it('should merge consecutive text deltas into one text part', () => {
      let parts: AgentMessagePart[] = []
      parts = applyStreamPart(parts, { type: 'text-delta', id: '1', text: 'Hello' })
      parts = applyStreamPart(parts, { type: 'text-delta', id: '1', text: ' world' })

      expect(parts).to.deep.equal([{ type: 'text', text: 'Hello world' }])
    })

    it('should track a tool call from running to done', () => {
      let parts: AgentMessagePart[] = [{ type: 'text', text: 'Checking' }]
      parts = applyStreamPart(parts, {
        type: 'tool-call',
        toolCallId: 'call-1',
        toolName: 'weather__get',
        title: 'weather - get',
        input: { city: 'LA' },
        dynamic: true,
      })
      expect(parts[1]).to.include({ type: 'tool', state: 'running', toolName: 'weather__get', title: 'weather - get' })

      parts = applyStreamPart(parts, {
        type: 'tool-result',
        toolCallId: 'call-1',
        toolName: 'weather__get',
        input: { city: 'LA' },
        output: 'Sunny',
        dynamic: true,
      })
      expect(parts[1]).to.include({ state: 'done', output: 'Sunny' })

      parts = applyStreamPart(parts, { type: 'text-delta', id: '2', text: 'It is sunny' })
      expect(parts).to.have.length(3)
      expect(parts[2]).to.deep.equal({ type: 'text', text: 'It is sunny' })
    })

    it('should record the message of a failed tool call', () => {
      let parts: AgentMessagePart[] = []
      parts = applyStreamPart(parts, {
        type: 'tool-call',
        toolCallId: 'call-1',
        toolName: 'broken',
        input: {},
        dynamic: true,
      })
      parts = applyStreamPart(parts, {
        type: 'tool-error',
        toolCallId: 'call-1',
        toolName: 'broken',
        input: {},
        error: new Error('Server offline'),
        dynamic: true,
      })

      expect(parts[0]).to.include({ state: 'error', error: 'Server offline' })
    })

    it('should ignore events that do not change the reply', () => {
      const parts: AgentMessagePart[] = [{ type: 'text', text: 'Hi' }]

      expect(applyStreamPart(parts, { type: 'start' })).to.equal(parts)
    })

    it('should mark a denied tool result as denied', () => {
      let parts: AgentMessagePart[] = []
      parts = applyStreamPart(parts, {
        type: 'tool-call',
        toolCallId: 'call-1',
        toolName: 'publish',
        input: {},
        dynamic: true,
      })
      parts = applyStreamPart(parts, {
        type: 'tool-result',
        toolCallId: 'call-1',
        toolName: 'publish',
        input: {},
        output: { denied: true, message: 'no' },
        dynamic: true,
      })

      expect(parts[0]).to.include({ state: 'denied' })
    })
  })

  describe('setToolState', () => {
    it('should update only the matching tool part', () => {
      const parts: AgentMessagePart[] = [
        { type: 'tool', toolCallId: 'c1', toolName: 'a', input: {}, state: 'running' },
        { type: 'tool', toolCallId: 'c2', toolName: 'b', input: {}, state: 'running' },
      ]

      const result = setToolState(parts, 'c2', 'awaiting-approval')

      expect(result[0]).to.include({ toolCallId: 'c1', state: 'running' })
      expect(result[1]).to.include({ toolCallId: 'c2', state: 'awaiting-approval' })
    })
  })

  describe('approveToolPart', () => {
    it('should run the approved part again and restart its timer', () => {
      const parts: AgentMessagePart[] = [
        { type: 'tool', toolCallId: 'c1', toolName: 'a', input: {}, state: 'awaiting-approval', startedAt: 1 },
        { type: 'tool', toolCallId: 'c2', toolName: 'b', input: {}, state: 'awaiting-approval', startedAt: 1 },
      ]

      const result = approveToolPart(parts, 'c1')

      expect(result[0]).to.include({ state: 'running' })
      expect((result[0] as { startedAt: number }).startedAt).to.be.greaterThan(1)
      expect(result[1]).to.include({ state: 'awaiting-approval', startedAt: 1 })
    })
  })

  describe('stopParts', () => {
    it('should turn unfinished tool calls into stopped errors', () => {
      const parts: AgentMessagePart[] = [
        { type: 'tool', toolCallId: 'c1', toolName: 'a', input: {}, state: 'running' },
        { type: 'tool', toolCallId: 'c2', toolName: 'b', input: {}, state: 'awaiting-approval' },
        { type: 'tool', toolCallId: 'c3', toolName: 'c', input: {}, state: 'done', output: 1 },
      ]

      const result = stopParts(parts)

      expect(result[0]).to.include({ state: 'error', error: 'Stopped by user' })
      expect(result[1]).to.include({ state: 'error', error: 'Stopped by user' })
      expect(result[2]).to.include({ state: 'done' })
    })

    it('should use the given reason', () => {
      const parts: AgentMessagePart[] = [{ type: 'tool', toolCallId: 'c1', toolName: 'a', input: {}, state: 'running' }]

      const result = stopParts(parts, 'Interrupted by an error')

      expect(result[0]).to.include({ state: 'error', error: 'Interrupted by an error' })
    })
  })

  describe('getPartsText', () => {
    it('should join only the text parts', () => {
      const text = getPartsText([
        { type: 'text', text: 'Before' },
        { type: 'tool', toolCallId: '1', toolName: 'a', input: {}, state: 'done', output: 'x' },
        { type: 'text', text: 'After' },
      ])

      expect(text).to.equal('Before\n\nAfter')
    })
  })

  describe('toModelMessages', () => {
    it('should keep plain messages as they are', () => {
      const messages = toModelMessages([
        { id: '1', role: 'user', content: 'Hi' },
        { id: '2', role: 'assistant', content: 'Hello' },
      ])

      expect(messages).to.deep.equal([
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ])
    })

    it('should replay each tool step as an assistant call followed by its result', () => {
      const messages = toModelMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Checking\n\nIt is sunny',
          parts: [
            { type: 'text', text: 'Checking' },
            {
              type: 'tool',
              toolCallId: 'c1',
              toolName: 'weather',
              input: { city: 'LA' },
              state: 'done',
              output: 'Sunny',
            },
            { type: 'tool', toolCallId: 'c2', toolName: 'alerts', input: {}, state: 'error', error: 'Timeout' },
            { type: 'text', text: 'It is sunny' },
          ],
        },
      ])

      expect(messages).to.deep.equal([
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Checking' },
            { type: 'tool-call', toolCallId: 'c1', toolName: 'weather', input: { city: 'LA' } },
            { type: 'tool-call', toolCallId: 'c2', toolName: 'alerts', input: {} },
          ],
        },
        {
          role: 'tool',
          content: [
            { type: 'tool-result', toolCallId: 'c1', toolName: 'weather', output: { type: 'text', value: 'Sunny' } },
            {
              type: 'tool-result',
              toolCallId: 'c2',
              toolName: 'alerts',
              output: { type: 'error-text', value: 'Timeout' },
            },
          ],
        },
        { role: 'assistant', content: [{ type: 'text', text: 'It is sunny' }] },
      ])
    })

    it('should replay structured tool output as JSON', () => {
      const [, toolMessage] = toModelMessages([
        {
          id: '1',
          role: 'assistant',
          content: '',
          parts: [{ type: 'tool', toolCallId: 'c1', toolName: 'list', input: {}, state: 'done', output: { count: 2 } }],
        },
      ])

      expect(toolMessage).to.deep.equal({
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: 'c1', toolName: 'list', output: { type: 'json', value: { count: 2 } } },
        ],
      })
    })

    it('should answer a tool call that never finished', () => {
      const [, toolMessage] = toModelMessages([
        {
          id: '1',
          role: 'assistant',
          content: '',
          parts: [{ type: 'tool', toolCallId: 'c1', toolName: 'slow', input: {}, state: 'running' }],
        },
      ])

      expect(toolMessage).to.deep.equal({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c1',
            toolName: 'slow',
            output: { type: 'error-text', value: 'The tool call was interrupted' },
          },
        ],
      })
    })

    it('should skip the step-limit marker', () => {
      const messages = toModelMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Done',
          parts: [
            { type: 'text', text: 'Done' },
            { type: 'step-limit', steps: 10 },
          ],
        },
      ])

      expect(messages).to.deep.equal([{ role: 'assistant', content: [{ type: 'text', text: 'Done' }] }])
    })

    it('should replay a denied tool call as a JSON refusal', () => {
      const [, toolMessage] = toModelMessages([
        {
          id: '1',
          role: 'assistant',
          content: '',
          parts: [
            {
              type: 'tool',
              toolCallId: 'c1',
              toolName: 'publish',
              input: {},
              state: 'denied',
              output: { denied: true, message: 'no' },
            },
          ],
        },
      ])

      expect(toolMessage).to.deep.equal({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c1',
            toolName: 'publish',
            output: { type: 'json', value: { denied: true, message: 'no' } },
          },
        ],
      })
    })
  })
})
