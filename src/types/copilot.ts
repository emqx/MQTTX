import type { OpenAIProvider } from '@ai-sdk/openai'
import type { DeepSeekProvider } from '@ai-sdk/deepseek'
import type { AnthropicProvider } from '@ai-sdk/anthropic'
import type { XaiProvider } from '@ai-sdk/xai'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'

import VueI18n from 'vue-i18n'

export type CopilotRole = 'system' | 'user' | 'assistant'

export interface CopilotMessage {
  id: string
  role: CopilotRole
  content: string
}

export interface CopilotPresetPrompt {
  prompt: string
  promptMap: PresetPromptMap
}

export type PresetPromptMap = Record<
  string,
  VueI18n.TranslateResult | Record<'system' | 'user', VueI18n.TranslateResult>
>

export interface MessagesResponse {
  messages: CopilotMessage[]
  hasMore: boolean
}

export interface StreamError {
  error: unknown
}

export interface CopilotInputProps {
  value: string
  disabled: boolean
}

export interface CopilotInputEvents {
  send: (message?: string) => void
  'preset-change': (data: CopilotPresetPrompt) => void
  focus: () => void
}

export interface CopilotMessagesProps {
  messages: CopilotMessage[]
  isSending: boolean
  responseStreamText: string
}

export interface CopilotMessagesEvents {
  'load-more-messages': () => void
  scrollToBottom: (behavior: ScrollBehavior) => void
}

export interface CopilotHeaderEvents {
  'clear-all-messages': () => void
  'toggle-window': () => void
}

export interface PresetPromptOption {
  value: string
  label: string | VueI18n.TranslateResult
  children?: PresetPromptOption[]
  allowedRoutes?: string[]
}

export type AIModel = Parameters<OpenAIProvider['chat']>[0]

export interface OpenAIOptionsModel {
  value: 'OpenAI'
  children: { value: Parameters<OpenAIProvider['chat']>[0] }[]
  providerCreator: typeof createOpenAI
}

export interface DeepSeekOptionsModel {
  value: 'DeepSeek'
  children: { value: Parameters<DeepSeekProvider['chat']>[0] }[]
  providerCreator: typeof createDeepSeek
}

export interface AnthropicOptionsModel {
  value: 'Anthropic'
  children: { value: Parameters<AnthropicProvider['languageModel']>[0] }[]
  providerCreator: typeof createAnthropic
}

export interface XaiOptionsModel {
  value: 'xAI'
  children: { value: Parameters<XaiProvider['chat']>[0] }[]
  providerCreator: typeof createXai
}

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

export type AImodelsOptionsModel = (
  | OpenAIOptionsModel
  | DeepSeekOptionsModel
  | AnthropicOptionsModel
  | XaiOptionsModel
  | SiliconFlowOptionsModel
)[]
