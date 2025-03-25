import type { OpenAIProvider } from '@ai-sdk/openai'
import type { DeepSeekProvider } from '@ai-sdk/deepseek'
import type { AnthropicProvider } from '@ai-sdk/anthropic'
import type { XaiProvider } from '@ai-sdk/xai'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { MCPPromptData } from '@/types/mcp'

import VueI18n from 'vue-i18n'

/**
 * Defines the role of a message in the Copilot conversation
 */
export type CopilotRole = 'system' | 'user' | 'assistant'

/**
 * Represents a single message in the Copilot conversation
 */
export interface CopilotMessage {
  id: string
  role: CopilotRole
  content: string
  reasoning?: string
}

/**
 * Defines a preset prompt with translation support
 */
export interface CopilotPresetPrompt {
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
  messages: CopilotMessage[]
  hasMore: boolean
}

/**
 * Error structure for streaming operations
 */
export interface StreamError {
  error: unknown
}

/**
 * Props for the Copilot input component
 */
export interface CopilotInputProps {
  value: string
  disabled: boolean
}

/**
 * Events emitted by the Copilot input component
 */
export interface CopilotInputEvents {
  send: (message?: string) => void
  'preset-change': (data: CopilotPresetPrompt) => void
  focus: () => void
}

/**
 * Props for the Copilot messages component
 */
export interface CopilotMessagesProps {
  messages: CopilotMessage[]
  isSending: boolean
  responseStreamText: string
}

/**
 * Events emitted by the Copilot messages component
 */
export interface CopilotMessagesEvents {
  'load-more-messages': () => void
  scrollToBottom: (behavior: ScrollBehavior) => void
}

/**
 * Events emitted by the Copilot header component
 */
export interface CopilotHeaderEvents {
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
export type AIModel = Parameters<OpenAIProvider['chat']>[0]

/**
 * Configuration for OpenAI models
 */
export interface OpenAIOptionsModel {
  value: 'OpenAI'
  children: { value: Parameters<OpenAIProvider['chat']>[0] }[]
  providerCreator: typeof createOpenAI
}

/**
 * Configuration for DeepSeek models
 */
export interface DeepSeekOptionsModel {
  value: 'DeepSeek'
  children: { value: Parameters<DeepSeekProvider['chat']>[0] }[]
  providerCreator: typeof createDeepSeek
}

/**
 * Configuration for Anthropic models
 */
export interface AnthropicOptionsModel {
  value: 'Anthropic'
  children: { value: Parameters<AnthropicProvider['languageModel']>[0] }[]
  providerCreator: typeof createAnthropic
}

/**
 * Configuration for xAI models
 */
export interface XaiOptionsModel {
  value: 'xAI'
  children: { value: Parameters<XaiProvider['chat']>[0] }[]
  providerCreator: typeof createXai
}

/**
 * Configuration for SiliconFlow models
 */
export interface SiliconFlowOptionsModel {
  value: 'SiliconFlow'
  children: {
    value:
      | 'deepseek-ai/DeepSeek-V3'
      | 'deepseek-ai/DeepSeek-R1'
      | 'Qwen/Qwen2-VL-72B-Instruct'
      | 'Qwen/Qwen2.5-72B-Instruct'
      | (string & {})
  }[]
  providerCreator: typeof createOpenAI
}

/**
 * Union type of all AI model option configurations
 */
export type AImodelsOptionsModel = (
  | OpenAIOptionsModel
  | DeepSeekOptionsModel
  | AnthropicOptionsModel
  | XaiOptionsModel
  | SiliconFlowOptionsModel
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
  mcpData?: MCPPromptData // MCP data for prompts
}

/**
 * Options for AI streaming configuration
 */
export interface AIStreamOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  disabledReasoningShow?: boolean
}

export interface ChatLoopOptions {
  // Core control functions
  shouldContinue: (content: string) => boolean
  updateCallback: (message: CopilotMessage) => Promise<void>
  // Optional configuration
  formatAppend?: (current: string, next: string) => string
  stopCondition?: (content: string) => boolean
  maxTurns?: number
  streamOptions?: AIStreamOptions
  existingMessage: CopilotMessage
}
