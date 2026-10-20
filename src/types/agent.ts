import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'
import type { LanguageModelV4CallOptions } from '@ai-sdk/provider'

/**
 * Defines the role of a message in the Agent conversation
 */
export type AgentRole = 'system' | 'user' | 'assistant'

/**
 * Lifecycle state of a tool call shown in the conversation
 */
export type AgentToolState = 'awaiting-approval' | 'running' | 'done' | 'error' | 'denied'

/**
 * Kind of a file the user attached to a message
 */
export type AgentAttachmentKind = 'image' | 'certificate' | 'private-key' | 'bundle' | 'text'

/**
 * A file the user attached to their message. Credentials only keep their path; images keep a
 * relative path inside agent-files; text files keep their (possibly truncated) content.
 */
export interface AgentAttachmentPart {
  type: 'attachment'
  kind: AgentAttachmentKind
  name: string
  size: number
  mediaType?: string
  relativePath?: string
  path?: string
  text?: string
  truncated?: boolean
}

/**
 * A part of a user message: a file the user attached, a Skill the user picked from the `/` menu, or a
 * connection the user mentioned with `@`. Only the id and the name are kept, so nothing else from the
 * connection record is ever stored in the conversation or sent to the model.
 */
export interface AgentSkillPart {
  type: 'skill'
  skill: string
}

/**
 * A connection the user mentioned with `@`
 */
export interface AgentConnectionPart {
  type: 'connection'
  connectionId: string
  name: string
}

/**
 * Compaction marker: the message it belongs to (a `system` message) replaces every message up to
 * `untilMessageId` with `summary`
 */
export interface AgentCompactionPart {
  type: 'compaction'
  summary: string
  /** Id of the last message the summary covers */
  untilMessageId: string
  /** How many messages the summary replaces */
  messageCount: number
  /** When the summary was written */
  createdAt: number
}

/**
 * A step of an assistant reply: generated text, a thinking block or a tool call made by the agent,
 * or a file / Skill the user attached to a user message
 */
export type AgentMessagePart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string; startedAt: number; finishedAt?: number }
  | AgentAttachmentPart
  | AgentSkillPart
  | AgentConnectionPart
  | AgentCompactionPart
  | {
      type: 'tool'
      toolCallId: string
      toolName: string
      title?: string
      input: unknown
      state: AgentToolState
      output?: unknown
      error?: string
      startedAt?: number
      finishedAt?: number
    }
  | { type: 'step-limit'; steps: number }

/**
 * Represents a single message in the Agent conversation
 */
export interface AgentMessage {
  id: string
  role: AgentRole
  content: string
  // Legacy: older messages stored all thinking of a reply in this string instead of reasoning parts
  reasoning?: string
  parts?: AgentMessagePart[]
  createAt?: string
  conversationId?: string
}

/**
 * Type alias for AI model identifiers
 */
export type AIModel = Parameters<
  ReturnType<
    | typeof createOpenAI
    | typeof createDeepSeek
    | typeof createAnthropic
    | typeof createXai
    | typeof createGoogleGenerativeAI
  >['languageModel']
>[0]

/**
 * A value of the AI SDK's unified `reasoning` call option, other than the provider default
 */
export type ReasoningEffort = Exclude<NonNullable<LanguageModelV4CallOptions['reasoning']>, 'provider-default'>

/**
 * One model a provider serves, with what MQTTX needs to know about it beyond its id: the label shown
 * in the pickers, and whether it accepts images, a reasoning strength and how much context it holds.
 */
interface ProviderModel<ModelId extends string> {
  value: ModelId
  label: string
  vision?: boolean
  reasoning?: boolean
  reasoningEfforts?: readonly ReasoningEffort[]
  /** Context window in tokens, as the provider lists it; unset falls back to a conservative default */
  contextWindow?: number
}

/**
 * A provider of `AImodelsOptions`: its name, the models it serves and the AI SDK package that talks to
 * it. The ids are typed by that package's own model id type, so the editor completes the known ids.
 */
interface ProviderOptions<Name extends string, ModelId extends string> {
  value: Name
  children: ProviderModel<ModelId>[]
  providerCreator: (...args: any[]) => any
}

/** The model id type of an AI SDK provider package: the argument its provider accepts */
type ServedModelIds<Creator extends (...args: any[]) => any> = Parameters<ReturnType<Creator>>[0]

/** SiliconFlow ids the list shows; any other id the user types is accepted too */
type SiliconFlowModelId =
  | 'deepseek-ai/DeepSeek-V3'
  | 'deepseek-ai/DeepSeek-R1'
  | 'Qwen/Qwen2-VL-72B-Instruct'
  | 'Qwen/Qwen2.5-72B-Instruct'
  // (string & {}) keeps autocomplete for the literals above while still allowing any model id
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {})

/** Providers whose model ids come straight from their package, so any string is a valid id */
type AddedProviderName =
  | 'Alibaba'
  | 'Mistral'
  | 'Groq'
  | 'Cohere'
  | 'Together AI'
  | 'Fireworks'
  | 'DeepInfra'
  | 'Cerebras'
  | 'Moonshot AI'
  | 'MiniMax'
  | 'Z.AI'
  | 'Perplexity'
  | 'Vercel AI Gateway'

/**
 * Every provider and the models it serves. The list itself is `AImodelsOptions` in
 * `src/utils/ai/models.ts`; the pickers, the icons and the reasoning menu all read that one table.
 */
export type AImodelsOptionsModel = Array<
  | ProviderOptions<'OpenAI', ServedModelIds<typeof createOpenAI>>
  | ProviderOptions<'DeepSeek', ServedModelIds<typeof createDeepSeek>>
  | ProviderOptions<'Anthropic', ServedModelIds<typeof createAnthropic>>
  | ProviderOptions<'xAI', ServedModelIds<typeof createXai>>
  | ProviderOptions<'Google', ServedModelIds<typeof createGoogleGenerativeAI>>
  | ProviderOptions<'SiliconFlow', SiliconFlowModelId>
  | ProviderOptions<'Azure OpenAI', ServedModelIds<typeof createAzure>>
  | ProviderOptions<AddedProviderName, string>
>
