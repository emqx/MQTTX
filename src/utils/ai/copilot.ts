import { AIModel, AImodelsOptionsModel } from '@/types/copilot'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import basePrompt from './prompts/base.txt'
import clientCodeGen from './prompts/clientCodeGen.txt'
import payloadGen from './prompts/payloadGen.txt'
import emqxGuide from './prompts/emqxGuide.txt'
import { ALL_CODE_GENERATION_COMMAND_VALUES, PAYLOAD_GENERATION_COMMAND_VALUES, EMQX_COMMAND_VALUES } from './preset'

const LANGUAGE_MAP = {
  zh: '请使用中文回答（简体中文）',
  en: 'Please answer in English（English）',
  tr: 'Lütfen Türkçe cevap verin（Turkish）',
  ja: '日本語で回答してください（Japanese）',
  hu: 'Kérjük, magyarul válaszoljon（Hungarian）',
}

export const loadSystemPrompt = (lang: Language, command?: string) => {
  let _basePrompt = basePrompt

  // Check if the command is related to code generation
  if (command && ALL_CODE_GENERATION_COMMAND_VALUES.includes(command)) {
    _basePrompt = `${_basePrompt}\n\n${clientCodeGen}`
  }

  // Check if the command is related to payload generation
  if (command && PAYLOAD_GENERATION_COMMAND_VALUES.includes(command)) {
    _basePrompt = `${_basePrompt}\n\n${payloadGen}`
  }

  if (command && EMQX_COMMAND_VALUES.includes(command)) {
    _basePrompt = `${_basePrompt}\n\n${emqxGuide}`
  }

  return `${_basePrompt}\n\n${LANGUAGE_MAP[lang]}`
}

/**
 * Configuration for available AI models across different providers.
 *
 * This array defines the supported AI models for MQTTX Copilot, organized by provider.
 * Each provider entry includes:
 * - value: The provider name identifier
 * - children: Array of available models for that provider
 * - providerCreator: Function to create the appropriate provider instance
 *
 * The structure follows the AImodelsOptionsModel type defined in types/copilot.ts
 */
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
  {
    value: 'xAI',
    children: [{ value: 'grok-2-1212' }],
    providerCreator: createXai,
  },
  {
    value: 'SiliconFlow',
    children: [
      { value: 'deepseek-ai/DeepSeek-V3' },
      { value: 'deepseek-ai/DeepSeek-R1' },
      { value: 'Qwen/Qwen2-VL-72B-Instruct' },
      { value: 'Qwen/Qwen2.5-72B-Instruct' },
    ],
    providerCreator: createOpenAI,
  },
]

/**
 * Default API host options for different AI providers.
 *
 * This array contains the base URLs for various AI service providers:
 * - OpenAI API endpoint
 * - DeepSeek API endpoint
 * - Anthropic API endpoint
 * - xAI API endpoint
 * - SiliconFlow API endpoint
 *
 * These URLs are used when configuring the API client for each provider.
 */
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
  {
    value: 'https://api.x.ai/v1',
  },
  {
    value: 'https://api.siliconflow.cn/v1',
  },
]

/**
 * Gets the appropriate model provider based on the specified model, base URL, and API key.
 *
 * @param opts - The options for creating the model provider
 * @param opts.model - The AI model to use
 * @param opts.baseURL - The base URL for the API
 * @param opts.apiKey - The API key for authentication
 * @returns A configured provider for the specified model
 */
export const getModelProvider = (opts: { model: AIModel; baseURL: string; apiKey: string }) => {
  const { model, baseURL, apiKey } = opts
  const currentModelOptions = AImodelsOptions.find((item) => item.children.some((child) => child.value === model))
  const providerCreator = currentModelOptions?.providerCreator || createOpenAI
  const provider = providerCreator({ baseURL, apiKey })
  return provider(model)
}
