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
 * A part of a user message: a file the user attached, or a Skill the user picked from the `/` menu
 */
export interface AgentSkillPart {
  type: 'skill'
  skill: string
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
 * Base interface for common properties
 */
interface BaseProviderOptionsModel {
  value: string
  children: {
    value: string
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator?: (...args: any[]) => any
}

/**
 * Configuration for OpenAI models
 */
export interface OpenAIOptionsModel extends BaseProviderOptionsModel {
  value: 'OpenAI'
  children: {
    value: Parameters<ReturnType<typeof createOpenAI>>[0]
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createOpenAI
}

/**
 * Configuration for DeepSeek models
 */
export interface DeepSeekOptionsModel extends BaseProviderOptionsModel {
  value: 'DeepSeek'
  children: {
    value: Parameters<ReturnType<typeof createDeepSeek>>[0]
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createDeepSeek
}

/**
 * Configuration for Anthropic models
 */
export interface AnthropicOptionsModel extends BaseProviderOptionsModel {
  value: 'Anthropic'
  children: {
    value: Parameters<ReturnType<typeof createAnthropic>>[0]
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createAnthropic
}

/**
 * Configuration for xAI models
 */
export interface XaiOptionsModel extends BaseProviderOptionsModel {
  value: 'xAI'
  children: {
    value: Parameters<ReturnType<typeof createXai>>[0]
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createXai
}

/**
 * Configuration for Google Generative AI models
 */
export interface GoogleOptionsModel extends BaseProviderOptionsModel {
  value: 'Google'
  children: {
    value: Parameters<ReturnType<typeof createGoogleGenerativeAI>>[0]
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createGoogleGenerativeAI
}

/**
 * Configuration for SiliconFlow models
 */
export interface SiliconFlowOptionsModel extends BaseProviderOptionsModel {
  value: 'SiliconFlow'
  children: {
    value:
      | 'deepseek-ai/DeepSeek-V3'
      | 'deepseek-ai/DeepSeek-R1'
      | 'Qwen/Qwen2-VL-72B-Instruct'
      | 'Qwen/Qwen2.5-72B-Instruct'
      // (string & {}) keeps autocomplete for the literals above while still allowing any model id
      // eslint-disable-next-line @typescript-eslint/ban-types
      | (string & {})
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createOpenAI
}

/**
 * Configuration for Azure OpenAI models
 */
export interface AzureOptionsModel extends BaseProviderOptionsModel {
  value: 'Azure OpenAI'
  children: {
    value: Parameters<ReturnType<typeof createAzure>>[0]
    label: string
    vision?: boolean
    reasoning?: boolean
    reasoningEfforts?: readonly ReasoningEffort[]
  }[]
  providerCreator: typeof createAzure
}

/**
 * Configuration for the providers added after the first release. Their model ids come straight from
 * each provider package, so the values stay plain strings.
 */
export interface ProviderOptionsModel extends BaseProviderOptionsModel {
  value:
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
  providerCreator: (...args: any[]) => any
}

/**
 * Union type of all AI model option configurations
 */
export type AImodelsOptionsModel = (
  | OpenAIOptionsModel
  | DeepSeekOptionsModel
  | AnthropicOptionsModel
  | XaiOptionsModel
  | GoogleOptionsModel
  | SiliconFlowOptionsModel
  | AzureOptionsModel
  | ProviderOptionsModel
)[]
