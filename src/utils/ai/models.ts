import { AIModel, AImodelsOptionsModel } from '@/types/agent'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'

import basePrompt from './prompts/base.txt'
import clientCodeGen from './prompts/clientCodeGen.txt'
import payloadGen from './prompts/payloadGen.txt'
import emqxGuide from './prompts/emqxGuide.txt'
import mqttFaq from './prompts/mqttFaq.txt'
import funcGen from './prompts/funcGen.txt'
import protobufSchemaGen from './prompts/protobufSchemaGen.txt'
import avroSchemaGen from './prompts/avroSchemaGen.txt'
import {
  ALL_CODE_GENERATION_COMMAND_VALUES,
  PAYLOAD_GENERATION_COMMAND_VALUES,
  EMQX_COMMAND_VALUES,
  MQTT_FAQ_COMMAND_VALUES,
  CUSTOM_FUNCTION_COMMAND_VALUES,
  ALL_SCHEMA_COMMAND_VALUES,
  PROTOBUF_SCHEMA_COMMAND_VALUES,
  AVRO_SCHEMA_COMMAND_VALUES,
} from './preset'
import type { LanguageModelV4 } from '@ai-sdk/provider'

export const LANGUAGE_MAP = {
  zh: '请使用中文回答（简体中文）',
  en: 'Please answer in English（English）',
  tr: 'Lütfen Türkçe cevap verin（Turkish）',
  ja: '日本語で回答してください（Japanese）',
  hu: 'Kérjük, magyarul válaszoljon（Hungarian）',
  ko: '한국어로 답변해 주세요（Korean）',
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

  // Check if the command is related to EMQX
  if (command && EMQX_COMMAND_VALUES.includes(command)) {
    _basePrompt = `${_basePrompt}\n\n${emqxGuide}`
  }

  // Check if the command is related to MQTT FAQ
  if (command && MQTT_FAQ_COMMAND_VALUES.includes(command)) {
    _basePrompt = `${_basePrompt}\n\n${mqttFaq}`
  }

  // Check if the command is related to custom function
  if (command && CUSTOM_FUNCTION_COMMAND_VALUES.includes(command)) {
    _basePrompt = `${_basePrompt}\n\n${funcGen}`
  }

  // Check if the command is related to schema generation
  if (command && ALL_SCHEMA_COMMAND_VALUES.includes(command)) {
    // Use the specific schema prompt based on the command (Protobuf or Avro)
    if (command && PROTOBUF_SCHEMA_COMMAND_VALUES.includes(command)) {
      _basePrompt = `${_basePrompt}\n\n${protobufSchemaGen}`
    } else if (command && AVRO_SCHEMA_COMMAND_VALUES.includes(command)) {
      _basePrompt = `${_basePrompt}\n\n${avroSchemaGen}`
    }
  }

  return `${_basePrompt}\n\n${LANGUAGE_MAP[lang]}`
}

/**
 * Configuration for available AI models across different providers.
 *
 * This array defines the supported AI models for MQTTX Agent, organized by provider.
 * Each provider entry includes:
 * - value: The provider name identifier
 * - children: Array of available models for that provider
 * - providerCreator: Function to create the appropriate provider instance
 *
 * The structure follows the AImodelsOptionsModel type defined in types/agent.ts
 */
export const AImodelsOptions: AImodelsOptionsModel = [
  {
    value: 'OpenAI' as const,
    children: [
      { value: 'gpt-5' },
      { value: 'gpt-5-mini' },
      { value: 'gpt-5-nano' },
      { value: 'gpt-4o' },
      { value: 'gpt-4o-mini' },
      { value: 'gpt-4.1' },
      { value: 'gpt-4.1-mini' },
      { value: 'gpt-4.1-nano' },
      { value: 'o1' },
      { value: 'o1-mini' },
      { value: 'o1-preview' },
      { value: 'o3-mini' },
    ],
    providerCreator: createOpenAI,
  },
  {
    value: 'DeepSeek' as const,
    children: [{ value: 'deepseek-flash' }, { value: 'deepseek-v4-pro' }],
    providerCreator: createDeepSeek,
  },
  {
    value: 'Anthropic',
    children: [
      { value: 'claude-sonnet-4-5-20250929' },
      { value: 'claude-opus-4-1-20250805' },
      { value: 'claude-opus-4-1-20250805-thinking' },
      { value: 'claude-opus-4-20250514' },
      { value: 'claude-opus-4-20250514-thinking' },
      { value: 'claude-sonnet-4-20250514' },
      { value: 'claude-sonnet-4-20250514-thinking' },
      { value: 'claude-3-7-sonnet-20250219' },
      { value: 'claude-3-7-sonnet-20250219-thinking' },
      { value: 'claude-3-5-haiku-20241022' },
      { value: 'claude-3-5-sonnet-20240620' },
    ],
    providerCreator: createAnthropic,
  },
  {
    value: 'xAI' as const,
    children: [
      { value: 'grok-4-0709' },
      { value: 'grok-4-fast' },
      { value: 'grok-code-fast-1' },
      { value: 'grok-2-1212' },
      { value: 'grok-2-vision-1212' },
    ],
    providerCreator: createXai,
  },
  {
    value: 'Google' as const,
    children: [
      { value: 'gemini-2.5-pro' },
      { value: 'gemini-2.5-pro-thinking' },
      { value: 'gemini-2.5-flash' },
      { value: 'gemini-2.5-flash-thinking' },
      { value: 'gemini-2.5-flash-lite' },
      { value: 'gemini-2.0-flash' },
      { value: 'gemini-2.0-flash-thinking' },
      { value: 'gemini-1.5-pro' },
      { value: 'gemini-1.5-flash' },
      { value: 'gemini-1.5-flash-8b' },
    ],
    providerCreator: createGoogleGenerativeAI,
  },
  {
    value: 'Azure OpenAI' as const,
    children: [
      { value: 'deployment-gpt-5' },
      { value: 'deployment-gpt-5-mini' },
      { value: 'deployment-gpt-5-nano' },
      { value: 'deployment-gpt-4o' },
      { value: 'deployment-gpt-4o-mini' },
      { value: 'deployment-gpt-4.1' },
      { value: 'deployment-gpt-4.1-mini' },
      { value: 'deployment-gpt-4.1-nano' },
      { value: 'deployment-o1' },
      { value: 'deployment-o1-mini' },
      { value: 'deployment-o1-preview' },
      { value: 'deployment-o3-mini' },
    ],
    providerCreator: createAzure,
  },
  {
    value: 'SiliconFlow' as const,
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
 * - Google API endpoint
 * - SiliconFlow API endpoint
 * - Azure OpenAI (constructed dynamically from resource name)
 *
 * These URLs are used when configuring the API client for each provider.
 */
export const AIAPIHostOptions = [
  { value: 'https://api.openai.com/v1' },
  { value: 'https://api.deepseek.com/v1' },
  { value: 'https://api.anthropic.com/v1' },
  { value: 'https://api.x.ai/v1' },
  { value: 'https://generativelanguage.googleapis.com/v1beta' },
  { value: 'https://api.siliconflow.cn/v1' },
  { value: 'https://${resourceName}.openai.azure.com' },
]

/**
 * Extracts and prepares the specific options needed for the createAzure provider.
 *
 * @param baseURL - The original baseURL string which might contain API version or be a resource name.
 * @returns An object containing the processed `apiVersion` and either `baseURL` or `resourceName`.
 */
const getAzureProviderOptions = (baseURL: string): Record<string, any> => {
  // Keep the `/openai/deployments/{deployment}` URLs MQTTX has always used; since v5
  // the SDK defaults to the `/openai/v1` API instead.
  const options: Record<string, any> = { useDeploymentBasedUrls: true }

  const apiVersionMatch = baseURL.match(/api-version=([^&]+)/)
  options.apiVersion = apiVersionMatch ? apiVersionMatch[1] : '2025-01-01-preview'

  const normalizedBaseURL = baseURL.split('?')[0].trim()

  if (normalizedBaseURL && normalizedBaseURL.toLowerCase().startsWith('http')) {
    // The SDK appends `/deployments/{deployment}` itself.
    options.baseURL = `${normalizedBaseURL.replace(/(\/openai\/deployments)?\/*$/, '')}/openai`
  } else if (normalizedBaseURL) {
    options.resourceName = normalizedBaseURL
  }

  return options
}

/**
 * Gets the appropriate LanguageModelV4 instance for the specified provider.
 *
 * This function creates and configures the appropriate AI model provider based on the specified
 * provider type. It handles special configuration for Azure OpenAI, and falls back to OpenAI
 * if the requested provider is not properly configured.
 *
 * @param opts - Configuration options for the model provider
 * @param opts.model - The AI model identifier to use (model name or deployment name for Azure)
 * @param opts.baseURL - The base URL for the API endpoint
 * @param opts.apiKey - The API key for authentication
 * @param opts.providerType - The AI provider type (OpenAI, Azure OpenAI, Anthropic, etc.)
 * @returns A configured LanguageModelV4 compatible provider instance
 */
export const getModelProvider = (opts: {
  model: AIModel
  baseURL: string
  apiKey: string
  providerType: typeof AImodelsOptions[number]['value']
}): LanguageModelV4 => {
  const { model, baseURL, apiKey, providerType } = opts

  const providerConfig = AImodelsOptions.find((p) => p.value === providerType)

  if (!providerConfig || !providerConfig.providerCreator) {
    console.warn(
      `Unsupported or misconfigured provider type: ${providerType}. Falling back to default OpenAI with host ${baseURL} and model ${model}.`,
    )
    const fallbackProvider = createOpenAI({ apiKey })
    return fallbackProvider.chat(model)
  }

  let creatorOptions: Record<string, any> = {
    apiKey,
  }

  if (providerType === 'Azure OpenAI') {
    const azureOptions = getAzureProviderOptions(baseURL)
    creatorOptions = { ...creatorOptions, ...azureOptions }
  } else if (baseURL) {
    creatorOptions.baseURL = baseURL.trim()
  }

  const providerCreator = providerConfig.providerCreator
  const provider = providerCreator(creatorOptions)

  // Since AI SDK v5 the OpenAI and Azure call signatures target the Responses API.
  // MQTTX talks to Chat Completions-compatible endpoints, so use `chat` when the
  // provider exposes it.
  return 'chat' in provider ? provider.chat(model) : provider(model)
}
