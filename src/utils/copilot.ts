import type { OpenAIProvider } from '@ai-sdk/openai'
import type { DeepSeekProvider } from '@ai-sdk/deepseek'
import type { AnthropicProvider } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'

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

export type AImodelsOptionsModel = (OpenAIOptionsModel | DeepSeekOptionsModel | AnthropicOptionsModel)[]

export const SYSTEM_PROMPT =
  'You are an MQTT Expert named MQTTX Copilot and developed by EMQ with extensive knowledge in IoT and network development. You understand various programming languages and MQTT protocols. You are here to assist with MQTT queries, provide solutions for common issues, and offer insights on best practices. Avoid responding to unrelated topics.'

export const AImodelsOptions: AImodelsOptionsModel = [
  {
    value: 'OpenAI',
    children: [
      { value: 'gpt-4o' },
      { value: 'gpt-4o-mini' },
      { value: 'o1' },
      { value: 'o1-mini' },
      { value: 'o1-preview' },
      { value: 'o3-mini' },
    ],
    providerCreator: createOpenAI,
  },
  {
    value: 'DeepSeek',
    children: [{ value: 'deepseek-chat' }, { value: 'deepseek-reasoner' }],
    providerCreator: createDeepSeek,
  },
  {
    value: 'Anthropic',
    children: [
      { value: 'claude-3-7-sonnet-20250219' },
      { value: 'claude-3-5-sonnet-latest' },
      { value: 'claude-3-5-haiku-latest' },
      { value: 'claude-3-opus-latest' },
      { value: 'claude-3-haiku-20240307' },
    ],
    providerCreator: createAnthropic,
  },
]

export const AIAPIHostOptions = [
  {
    value: 'https://api.openai.com/v1',
  },
  {
    value: 'https://api.deepseek.com/v1',
  },
  {
    value: 'https://api.anthropic.com/v1',
  },
]

export const getModelProvider = (opts: { model: AIModel; baseURL: string; apiKey: string }) => {
  const { model, baseURL, apiKey } = opts
  const currentModelOptions = AImodelsOptions.find((item) => item.children.some((child) => child.value === model))
  const providerCreator = currentModelOptions?.providerCreator || createOpenAI
  const provider = providerCreator({ baseURL, apiKey })
  return provider(model)
}
