/**
 * Context budget for the Agent: a dependency-free token estimate, the context window of the models it
 * knows, and the two ways the history is kept small — compacting old turns into a summary, and trimming
 * earlier tool results inside one reply.
 */
import type { ModelMessage } from 'ai'
import type { AgentMessage } from '@/types/agent'
import { getAgentMessageId } from '@/utils/idGenerator'
import { findLastCompaction, toModelMessages } from './messageParts'

/** Past this share of the context window the older turns are compacted into a summary */
export const COMPACT_THRESHOLD = 0.6
/** How many turns (a user message and its replies) are always sent as they are */
export const KEEP_RECENT_TURNS = 4
/** How many tool results inside one reply keep their full output */
export const KEEP_LAST_TOOL_RESULTS = 3

const DEFAULT_CONTEXT_WINDOW = 128000
const TOKENS_PER_IMAGE = 1000
const LATIN_CHARS_PER_TOKEN = 4
/** CJK, kana, hangul and full-width forms: roughly one token each */
const FULL_WIDTH_CHARACTER =
  /[\u1100-\u115F\u2E80-\u303F\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/

/** Rough token count of a text: one per full-width character, one per four other characters */
export const estimateTextTokens = (text: string): number => {
  const characters = [...text]
  const fullWidth = characters.filter((character) => FULL_WIDTH_CHARACTER.test(character)).length
  return fullWidth + Math.ceil((characters.length - fullWidth) / LATIN_CHARS_PER_TOKEN)
}

/**
 * Rough token count of a text or of model messages. Tool inputs and results are measured as JSON, and
 * every image counts as a fixed block, so the estimate never needs a tokenizer.
 */
export const estimateTokens = (value: string | ModelMessage[]): number => {
  if (typeof value === 'string') return estimateTextTokens(value)

  let total = 0
  for (const message of value) {
    const content = message.content
    if (typeof content === 'string') {
      total += estimateTextTokens(content)
      continue
    }
    for (const part of content as unknown as Array<Record<string, unknown>>) {
      switch (part.type) {
        case 'text':
        case 'reasoning':
          total += estimateTextTokens(typeof part.text === 'string' ? part.text : '')
          break
        case 'image':
        case 'file':
        case 'reasoning-file':
          total += TOKENS_PER_IMAGE
          break
        case 'tool-call':
          total += estimateTextTokens(JSON.stringify(part.input ?? {}))
          break
        case 'tool-result':
          total += estimateTextTokens(JSON.stringify(part.output ?? null))
          break
        default:
          break
      }
    }
  }
  return total
}

/** Context windows of the models MQTTX lists; anything else uses the conservative default */
const CONTEXT_WINDOWS: Array<{ pattern: RegExp; window: number }> = [
  { pattern: /^gpt-5/, window: 400000 },
  { pattern: /^gpt-4\.1/, window: 1047576 },
  { pattern: /^gpt-4o/, window: 128000 },
  { pattern: /^o3/, window: 200000 },
  { pattern: /^o4-mini/, window: 200000 },
  { pattern: /^claude-/, window: 200000 },
  { pattern: /^gemini-2\.5-/, window: 1048576 },
  { pattern: /^gemini-3/, window: 1048576 },
]

/** Context window of a model id, in tokens */
export const getContextWindow = (model: string): number => {
  const id = model.toLowerCase()
  return CONTEXT_WINDOWS.find((entry) => entry.pattern.test(id))?.window ?? DEFAULT_CONTEXT_WINDOW
}

/** Compact token count for the composer meter: 950, 9.9k, 12k, 128k, 1.0M */
export const formatTokens = (tokens: number): string => {
  const count = Math.max(0, tokens)
  if (count < 1000) return String(Math.round(count))
  if (count < 9950) return `${(count / 1000).toFixed(1)}k`
  if (count < 1000000) return `${Math.round(count / 1000)}k`
  return `${(count / 1000000).toFixed(1)}M`
}

/** Share of the context window in use, in whole percent, capped at 100 */
export const contextPercent = (tokens: number, window: number): number => {
  if (!Number.isFinite(window) || window <= 0) return 0
  return Math.min(100, Math.round((Math.max(0, tokens) / window) * 100))
}

/**
 * Whether the history should be compacted: the estimate is over the threshold and there are at least
 * two messages before the turns that are kept as they are.
 */
export const shouldCompact = (options: { estimate: number; window: number; olderMessageCount: number }): boolean =>
  options.estimate > options.window * COMPACT_THRESHOLD && options.olderMessageCount >= 2

/** Index of the first message of the last `keepTurns` turns; a turn starts at a user message */
const keepFrom = (messages: AgentMessage[], keepTurns: number): number => {
  let turns = 0
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role !== 'user') continue
    turns += 1
    if (turns >= keepTurns) return index
  }
  return 0
}

/** The messages before the last `keepTurns` turns: the ones a summary replaces */
export const olderMessages = (messages: AgentMessage[], keepTurns = KEEP_RECENT_TURNS): AgentMessage[] =>
  messages.slice(0, keepFrom(messages, keepTurns))

/** The newest messages that fit the budget, used when the summary could not be written */
export const fitToBudget = (
  messages: AgentMessage[],
  budget: number,
  usedTokens: number,
  readImage?: (relativePath: string) => Buffer | null,
): AgentMessage[] => {
  const kept: AgentMessage[] = []
  let used = usedTokens
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const cost = estimateTokens(toModelMessages([messages[index]], readImage))
    if (kept.length > 0 && used + cost > budget) break
    used += cost
    kept.unshift(messages[index])
  }
  return kept
}

const omittedNote = (output: unknown): string => {
  const bytes = JSON.stringify(output ?? null)?.length ?? 0
  return `[Earlier result omitted to save context (~${Math.max(
    1,
    Math.round(bytes / 1024),
  )} KB). Call the tool again if you need it.]`
}

/**
 * Replaces the output of every tool result older than the last `keepLast` ones with a short note, and
 * drops the reasoning of every message but the last. Tool calls stay in place, so every result keeps
 * the call it belongs to and the provider accepts the messages.
 */
export const trimToolResults = (messages: ModelMessage[], keepLast = KEEP_LAST_TOOL_RESULTS): ModelMessage[] => {
  const resultKeys: string[] = []
  messages.forEach((message, messageIndex) => {
    if (typeof message.content === 'string') return
    message.content.forEach((part, partIndex) => {
      if (part.type === 'tool-result') resultKeys.push(`${messageIndex}:${partIndex}`)
    })
  })
  const kept = new Set(keepLast > 0 ? resultKeys.slice(-keepLast) : [])
  const lastIndex = messages.length - 1

  return messages.map((message, messageIndex) => {
    if (typeof message.content === 'string') return message
    const content = message.content.flatMap((part, partIndex) => {
      if (part.type === 'reasoning' && messageIndex !== lastIndex) return []
      if (part.type === 'tool-result' && !kept.has(`${messageIndex}:${partIndex}`)) {
        return [{ ...part, output: { type: 'text' as const, value: omittedNote(part.output) } }]
      }
      return [part]
    })
    return { ...message, content } as ModelMessage
  })
}

/** Provider messages that mean "this request does not fit the context window" */
const OVERFLOW_MESSAGES = [
  'context length',
  'context_length',
  'maximum context',
  'context window',
  'too many tokens',
  'prompt is too long',
  'input is too long',
  'reduce the length',
  'exceeds the maximum',
]

const errorText = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    // APICallError keeps the provider body next to its own message
    const record = error as { message?: unknown; responseBody?: unknown }
    return [record.message, record.responseBody].filter((value): value is string => typeof value === 'string').join(' ')
  }
  return String(error ?? '')
}

/** Whether an error means the request was longer than the model context window */
export const isContextOverflowError = (error: unknown): boolean => {
  const text = errorText(error).toLowerCase()
  return OVERFLOW_MESSAGES.some((needle) => text.includes(needle))
}

export interface CompactionHistory {
  /** The messages to send: the conversation, plus the new marker when one was written */
  messages: AgentMessage[]
  /** The compaction marker to store, when a summary was written */
  marker?: AgentMessage
  /** The summary failed, so the oldest turns were dropped instead */
  fitted: boolean
}

/** Whether a message is a compaction marker */
const isMarker = (message: AgentMessage): boolean => (message.parts ?? []).some((part) => part.type === 'compaction')

/** The messages after the part the newest marker covers */
const messagesSince = (
  messages: AgentMessage[],
  marker: { index: number; part: { untilMessageId: string } },
): AgentMessage[] => {
  const boundary = messages.findIndex((message) => message.id === marker.part.untilMessageId)
  return boundary === -1 ? messages.slice(marker.index + 1) : messages.slice(boundary + 1)
}

/**
 * Compacts the older turns of a conversation into one summary message, or lets the history through when
 * it still fits. The summary is written by the injected `summarize`, so a failure can be handled here:
 * the oldest messages are dropped until what is left fits the budget.
 */
export const compactHistory = async (options: {
  messages: AgentMessage[]
  conversationId: string
  /** Context window of the model, in tokens */
  window: number
  /** Estimated tokens of the system prompt and the app context */
  systemTokens: number
  /** Writes the summary of the older turns, folding in the previous one; null when it failed */
  summarize: (older: AgentMessage[], previousSummary?: string) => Promise<string | null>
  /** Compact without checking the threshold, for a request the provider already refused */
  force?: boolean
}): Promise<CompactionHistory> => {
  const { messages, conversationId, window, systemTokens, summarize, force = false } = options
  const marker = findLastCompaction(messages)
  // Markers are not turns: they are replaced by the summary they hold
  const since = (marker ? messagesSince(messages, marker) : messages).filter((message) => !isMarker(message))
  const older = olderMessages(since)
  const estimate = systemTokens + estimateTokens(toModelMessages(since))

  if (!older.length || (!force && !shouldCompact({ estimate, window, olderMessageCount: older.length }))) {
    return { messages, fitted: false }
  }

  const summary = await summarize(older, marker?.part.summary)
  if (!summary) {
    const fitted = fitToBudget(since, window * COMPACT_THRESHOLD, systemTokens)
    // Keep the previous marker so its summary still reaches the model
    return { messages: marker ? [marker.message, ...fitted] : fitted, fitted: true }
  }

  const covered = older[older.length - 1]
  const created: AgentMessage = {
    id: getAgentMessageId(),
    role: 'system',
    content: summary,
    conversationId,
    // The marker sorts right after the messages it covers, so the divider sits at the boundary
    createAt: covered.createAt,
    parts: [
      {
        type: 'compaction',
        summary,
        untilMessageId: covered.id,
        messageCount: older.length,
        createdAt: Date.now(),
      },
    ],
  }
  return { messages: [...messages, created], marker: created, fitted: false }
}
