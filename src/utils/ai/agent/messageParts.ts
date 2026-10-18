import fs from 'fs'
import type { ModelMessage, TextStreamPart, ToolSet, AssistantContent, ToolContent } from 'ai'
import { AgentMessage, AgentMessagePart, AgentToolState } from '@/types/agent'
import { resolveArchiveSync } from './files'
import { renderSkillPrompt } from './skills'

type ToolPart = Extract<AgentMessagePart, { type: 'tool' }>
type AttachmentPart = Extract<AgentMessagePart, { type: 'attachment' }>
type SkillPart = Extract<AgentMessagePart, { type: 'skill' }>

/** Reads an attached image from agent-files; replaced with a fake in tests */
const defaultReadImage = (relativePath: string): Buffer | null => {
  const filePath = resolveArchiveSync(relativePath)
  if (!filePath) return null
  try {
    return fs.readFileSync(filePath)
  } catch {
    return null
  }
}

type UserContent = Array<{ type: 'text'; text: string } | { type: 'image'; image: Buffer; mediaType: string }>

/** Builds the multimodal user content for a message that has attachments or a selected Skill */
const buildUserContent = (message: AgentMessage, readImage: (relativePath: string) => Buffer | null): UserContent => {
  const attachments = (message.parts ?? []).filter((part): part is AttachmentPart => part.type === 'attachment')
  const skills = (message.parts ?? []).filter((part): part is SkillPart => part.type === 'skill')
  const content: UserContent = []
  const lead = skills.map((part) => renderSkillPrompt(part.skill)).join('\n')
  const text = [lead, message.content].filter(Boolean).join('\n')
  if (text) content.push({ type: 'text', text })

  for (const part of attachments) {
    if (part.kind !== 'text') continue
    const note = part.truncated ? `\n[truncated: showing the first 64 KB of ${Math.round(part.size / 1024)} KB]` : ''
    // Leading blank line: some providers join text parts without a separator, which would glue "File:" to the text before it
    content.push({ type: 'text', text: `\n\nFile: ${part.name}\n\`\`\`\n${part.text ?? ''}\n\`\`\`${note}` })
  }

  const credentials = attachments.filter((part) => part.kind !== 'image' && part.kind !== 'text')
  if (credentials.length) {
    const lines = credentials.map((part) => `- ${part.name} (${part.kind}): ${part.path}`)
    content.push({
      type: 'text',
      text:
        '\n\nAttached credential files (contents are never shared; use the paths in create_connection/update_connection or inspect_certificate):\n' +
        lines.join('\n'),
    })
  }

  for (const part of attachments) {
    if (part.kind !== 'image') continue
    const image = part.relativePath ? readImage(part.relativePath) : null
    if (image) {
      content.push({ type: 'image', image, mediaType: part.mediaType ?? 'image/png' })
    } else {
      content.push({ type: 'text', text: `\n\n[image ${part.name} is no longer available]` })
    }
  }

  return content
}

/**
 * `save_files` carries whole file contents. Keeping them in the stored tool part would resend them to
 * the model on every turn and show them in the step details, so only the metadata is kept.
 */
export const slimToolInput = (toolName: string, input: unknown): unknown => {
  if (toolName !== 'save_files') return input
  const value = (input ?? {}) as { name?: string; files?: { path?: string; content?: string }[] }
  return {
    name: value.name,
    files: (value.files ?? []).map((file) => ({
      path: file.path,
      size: file.content ? Buffer.byteLength(file.content, 'utf8') : 0,
    })),
  }
}

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
          input: slimToolInput(part.toolName, part.input),
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
    case 'reasoning-start':
      return [...parts, { type: 'reasoning', text: '', startedAt: Date.now() }]
    case 'reasoning-delta': {
      const last = parts[parts.length - 1]
      if (last && last.type === 'reasoning') {
        return [...parts.slice(0, -1), { ...last, text: last.text + part.text }]
      }
      return [...parts, { type: 'reasoning', text: part.text, startedAt: Date.now() }]
    }
    case 'reasoning-end': {
      const last = parts[parts.length - 1]
      if (!last || last.type !== 'reasoning' || last.finishedAt !== undefined) return parts
      return [...parts.slice(0, -1), { ...last, finishedAt: Date.now() }]
    }
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
 * Marks every tool call that never finished as stopped, used when the user aborts the reply.
 * An unfinished thinking block is closed too so it persists with an end time.
 */
export const stopParts = (parts: AgentMessagePart[], reason = 'Stopped by user'): AgentMessagePart[] =>
  parts.map((part) => {
    if (part.type === 'tool' && (part.state === 'running' || part.state === 'awaiting-approval')) {
      return { ...part, state: 'error' as const, error: reason }
    }
    if (part.type === 'reasoning' && part.finishedAt === undefined) {
      return { ...part, finishedAt: Date.now() }
    }
    return part
  })

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
export const toModelMessages = (
  messages: AgentMessage[],
  readImage: (relativePath: string) => Buffer | null = defaultReadImage,
): ModelMessage[] =>
  messages.flatMap((message): ModelMessage[] => {
    if (
      message.role === 'user' &&
      (message.parts ?? []).some((part) => part.type === 'attachment' || part.type === 'skill')
    ) {
      return [{ role: 'user', content: buildUserContent(message, readImage) } as ModelMessage]
    }
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
      if (
        part.type === 'step-limit' ||
        part.type === 'reasoning' ||
        part.type === 'attachment' ||
        part.type === 'skill'
      )
        continue
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
