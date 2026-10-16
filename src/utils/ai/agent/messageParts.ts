import type { ModelMessage, TextStreamPart, ToolSet, AssistantContent, ToolContent } from 'ai'
import { AgentMessage, AgentMessagePart, AgentToolState } from '@/types/agent'

type ToolPart = Extract<AgentMessagePart, { type: 'tool' }>

/**
 * Returns the parts of a reply after applying one event of the agent stream
 */
export const applyStreamPart = (parts: AgentMessagePart[], part: TextStreamPart<ToolSet>): AgentMessagePart[] => {
  const updateTool = (toolCallId: string, update: Partial<ToolPart>) =>
    parts.map((item) => (item.type === 'tool' && item.toolCallId === toolCallId ? { ...item, ...update } : item))

  switch (part.type) {
    case 'text-delta': {
      const last = parts[parts.length - 1]
      if (last && last.type === 'text') {
        return [...parts.slice(0, -1), { type: 'text', text: last.text + part.text }]
      }
      return [...parts, { type: 'text', text: part.text }]
    }
    case 'tool-call':
      return [
        ...parts,
        {
          type: 'tool',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          title: part.title,
          input: part.input,
          state: 'running',
          startedAt: Date.now(),
        },
      ]
    case 'tool-result': {
      const denied = (part.output as { denied?: boolean } | undefined)?.denied === true
      return updateTool(part.toolCallId, {
        state: denied ? 'denied' : 'done',
        output: part.output,
        finishedAt: Date.now(),
      })
    }
    case 'tool-error':
      return updateTool(part.toolCallId, {
        state: 'error',
        error: part.error instanceof Error ? part.error.message : String(part.error),
        finishedAt: Date.now(),
      })
    default:
      return parts
  }
}

/**
 * Sets the state of one tool part, used by the approval flow
 */
export const setToolState = (
  parts: AgentMessagePart[],
  toolCallId: string,
  state: AgentToolState,
): AgentMessagePart[] =>
  parts.map((part) => (part.type === 'tool' && part.toolCallId === toolCallId ? { ...part, state } : part))

/**
 * Marks an approved tool part as running again; its duration counts from the approval, not the request
 */
export const approveToolPart = (parts: AgentMessagePart[], toolCallId: string): AgentMessagePart[] =>
  parts.map((part) =>
    part.type === 'tool' && part.toolCallId === toolCallId
      ? { ...part, state: 'running' as const, startedAt: Date.now() }
      : part,
  )

/**
 * Appends the marker that pauses the reply when it reached the step limit
 */
export const appendStepLimit = (parts: AgentMessagePart[], steps: number): AgentMessagePart[] => [
  ...parts,
  { type: 'step-limit', steps },
]

/**
 * Marks every tool call that never finished as stopped, used when the user aborts the reply
 */
export const stopParts = (parts: AgentMessagePart[], reason = 'Stopped by user'): AgentMessagePart[] =>
  parts.map((part) =>
    part.type === 'tool' && (part.state === 'running' || part.state === 'awaiting-approval')
      ? { ...part, state: 'error' as const, error: reason }
      : part,
  )

/**
 * Joins the text parts of a reply
 */
export const getPartsText = (parts: AgentMessagePart[]): string =>
  parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .filter(Boolean)
    .join('\n\n')

/**
 * Returns a plain copy of a value, dropping Vue reactivity (the `__ob__` observer) that
 * would otherwise fail the AI SDK message schema.
 */
const toPlain = (value: unknown): unknown => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))

/**
 * Converts the stored conversation into model messages, replaying the tool calls of each reply
 */
export const toModelMessages = (messages: AgentMessage[]): ModelMessage[] =>
  messages.flatMap((message): ModelMessage[] => {
    if (message.role !== 'assistant' || !message.parts || message.parts.length === 0) {
      return [{ role: message.role, content: message.content }]
    }

    const result: ModelMessage[] = []
    let assistantContent: Exclude<AssistantContent, string> = []
    let toolContent: ToolContent = []

    // A step ends when text follows tool calls: the model saw the tool results before writing it
    const flush = () => {
      if (assistantContent.length > 0) result.push({ role: 'assistant', content: assistantContent })
      if (toolContent.length > 0) result.push({ role: 'tool', content: toolContent })
      assistantContent = []
      toolContent = []
    }

    for (const part of message.parts) {
      if (part.type === 'step-limit') continue
      if (part.type === 'text') {
        if (toolContent.length > 0) flush()
        assistantContent.push({ type: 'text', text: part.text })
        continue
      }
      assistantContent.push({
        type: 'tool-call',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: toPlain(part.input) as any,
      })
      toolContent.push({
        type: 'tool-result',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        output:
          part.state === 'denied'
            ? {
                type: 'json',
                value: toPlain(part.output ?? { denied: true, message: 'The user denied this action.' }) as any,
              }
            : part.state !== 'done'
            ? { type: 'error-text', value: part.error ?? 'The tool call was interrupted' }
            : typeof part.output === 'string'
            ? { type: 'text', value: part.output }
            : { type: 'json', value: toPlain(part.output ?? null) as any },
      })
    }
    flush()
    return result
  })
