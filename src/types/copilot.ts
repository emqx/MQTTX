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
