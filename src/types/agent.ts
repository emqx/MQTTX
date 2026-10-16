import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

import VueI18n from 'vue-i18n'

/**
 * Defines the role of a message in the Agent conversation
 */
export type AgentRole = 'system' | 'user' | 'assistant'

/**
 * Lifecycle state of a tool call shown in the conversation
 */
export type AgentToolState = 'awaiting-approval' | 'running' | 'done' | 'error' | 'denied'

/**
 * A step of an assistant reply: generated text or a tool call made by the agent
 */
export type AgentMessagePart =
  | { type: 'text'; text: string }
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
  reasoning?: string
  parts?: AgentMessagePart[]
  createAt?: string
  conversationId?: string
}

/**
 * Defines a preset prompt with translation support
 */
export interface AgentPresetPrompt {
  prompt: string
  promptMap: PresetPromptMap
}

/**
 * Maps preset prompts to their translated versions
 */
export type PresetPromptMap = Record<
  string,
  VueI18n.TranslateResult | Record<'system' | 'user', VueI18n.TranslateResult>
>

/**
 * Response structure for message retrieval operations
 */
export interface MessagesResponse {
  messages: AgentMessage[]
  hasMore: boolean
}

/**
 * Props for the Agent input component
 */
export interface AgentComposerProps {
  value: string
  disabled: boolean
}

/**
 * Events emitted by the Agent input component
 */
export interface AgentComposerEvents {
  send: (message?: string) => void
  'preset-change': (data: AgentPresetPrompt) => void
  focus: () => void
}

/**
 * Props for the Agent messages component
 */
export interface AgentMessagesProps {
  messages: AgentMessage[]
  isSending: boolean
  streamingMessage: AgentMessage | null
}

/**
 * Events emitted by the Agent messages component
 */
export interface AgentMessagesEvents {
  'load-more-messages': () => void
  scrollToBottom: (behavior: ScrollBehavior) => void
}

/**
 * Events emitted by the Agent header component
 */
export interface AgentHeaderEvents {
  'clear-all-messages': () => void
  'toggle-window': () => void
}

/**
 * Option structure for preset prompts in dropdown menus
 */
export interface PresetPromptOption {
  value: string
  label: string | VueI18n.TranslateResult
  children?: PresetPromptOption[]
  allowedRoutes?: string[]
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
 * Base interface for common properties
 */
interface BaseProviderOptionsModel {
  value: string
  children: { value: string }[]
  providerCreator?: (...args: any[]) => any
}

/**
 * Configuration for OpenAI models
 */
export interface OpenAIOptionsModel extends BaseProviderOptionsModel {
  value: 'OpenAI'
  children: { value: Parameters<ReturnType<typeof createOpenAI>>[0] }[]
  providerCreator: typeof createOpenAI
}

/**
 * Configuration for DeepSeek models
 */
export interface DeepSeekOptionsModel extends BaseProviderOptionsModel {
  value: 'DeepSeek'
  children: { value: Parameters<ReturnType<typeof createDeepSeek>>[0] }[]
  providerCreator: typeof createDeepSeek
}

/**
 * Configuration for Anthropic models
 */
export interface AnthropicOptionsModel extends BaseProviderOptionsModel {
  value: 'Anthropic'
  children: { value: Parameters<ReturnType<typeof createAnthropic>>[0] }[]
  providerCreator: typeof createAnthropic
}

/**
 * Configuration for xAI models
 */
export interface XaiOptionsModel extends BaseProviderOptionsModel {
  value: 'xAI'
  children: { value: Parameters<ReturnType<typeof createXai>>[0] }[]
  providerCreator: typeof createXai
}

/**
 * Configuration for Google Generative AI models
 */
export interface GoogleOptionsModel extends BaseProviderOptionsModel {
  value: 'Google'
  children: {
    value: Parameters<ReturnType<typeof createGoogleGenerativeAI>>[0]
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
  }[]
  providerCreator: typeof createOpenAI
}

/**
 * Configuration for Azure OpenAI models
 */
export interface AzureOptionsModel extends BaseProviderOptionsModel {
  value: 'Azure OpenAI'
  children: { value: Parameters<ReturnType<typeof createAzure>>[0] }[]
  providerCreator: typeof createAzure
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
)[]

/**
 * Type definition for prompt options
 */
export interface PromptOptionDefinition {
  value: string
  labelKey: string
  prompt: string | { system: string; user: string }
  params?: string[]
}

/**
 * Session state interface
 */
export interface SessionState {
  systemPrompt: string // Current system prompt for the session
  presetPrompt: string // Current preset prompt being used
  isNewSession: boolean // Whether this is a new session
  lastPresetChangeTime: number // Timestamp of the last preset change
}
