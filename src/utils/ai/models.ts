import { AIModel, AImodelsOptionsModel } from '@/types/agent'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'
import { createAlibaba } from '@ai-sdk/alibaba'
import { createMistral } from '@ai-sdk/mistral'
import { createGroq } from '@ai-sdk/groq'
import { createCohere } from '@ai-sdk/cohere'
import { createTogetherAI } from '@ai-sdk/togetherai'
import { createFireworks } from '@ai-sdk/fireworks'
import { createDeepInfra } from '@ai-sdk/deepinfra'
import { createCerebras } from '@ai-sdk/cerebras'
import { createMoonshotAI } from '@ai-sdk/moonshotai'
import { createMiniMax } from '@ai-sdk/minimax'
import { createZai } from '@ai-sdk/zai'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createGateway } from '@ai-sdk/gateway'

import basePrompt from './prompts/base.txt'
import { renderSkillList } from './agent/skills'
import type { LanguageModelV4 } from '@ai-sdk/provider'

export const LANGUAGE_MAP = {
  zh: '请使用中文回答（简体中文）',
  en: 'Please answer in English（English）',
  tr: 'Lütfen Türkçe cevap verin（Turkish）',
  ja: '日本語で回答してください（Japanese）',
  hu: 'Kérjük, magyarul válaszoljon（Hungarian）',
  ko: '한국어로 답변해 주세요（Korean）',
}

export const loadSystemPrompt = (lang: Language): string =>
  `${basePrompt}\n\n${renderSkillList()}\n\n${LANGUAGE_MAP[lang]}`

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
      { value: 'gpt-6-luna', label: 'GPT-6 Luna' },
      { value: 'gpt-5.4', label: 'GPT-5.4' },
      { value: 'gpt-5.2', label: 'GPT-5.2' },
      { value: 'gpt-5.1', label: 'GPT-5.1' },
      { value: 'gpt-5', label: 'GPT-5' },
      { value: 'gpt-5-mini', label: 'GPT-5 mini' },
      { value: 'gpt-5-nano', label: 'GPT-5 nano' },
      { value: 'gpt-4o', label: 'GPT-4o', reasoning: false },
      { value: 'gpt-4o-mini', label: 'GPT-4o mini', reasoning: false },
      { value: 'gpt-4.1', label: 'GPT-4.1', reasoning: false },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini', reasoning: false },
    ],
    providerCreator: createOpenAI,
  },
  {
    value: 'DeepSeek' as const,
    children: [
      { value: 'deepseek-flash', label: 'DeepSeek V4.1 Flash' },
      { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', vision: false },
    ],
    providerCreator: createDeepSeek,
  },
  {
    value: 'Anthropic',
    children: [
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
      { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5' },
      { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
    providerCreator: createAnthropic,
  },
  {
    value: 'xAI' as const,
    children: [
      { value: 'grok-4.20-reasoning', label: 'Grok 4.20 Reasoning', reasoning: false },
      { value: 'grok-4.20-non-reasoning', label: 'Grok 4.20', reasoning: false },
      { value: 'grok-4.7', label: 'Grok 4.7' },
      { value: 'grok-4.6', label: 'Grok 4.6' },
      { value: 'grok-4.5', label: 'Grok 4.5' },
      { value: 'grok-4.3', label: 'Grok 4.3' },
    ],
    providerCreator: createXai,
  },
  {
    value: 'Google' as const,
    children: [
      { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
      { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    ],
    providerCreator: createGoogleGenerativeAI,
  },
  {
    value: 'Azure OpenAI' as const,
    children: [
      { value: 'deployment-gpt-6-luna', label: 'GPT-6 Luna' },
      { value: 'deployment-gpt-5.4', label: 'GPT-5.4' },
      { value: 'deployment-gpt-5.2', label: 'GPT-5.2' },
      { value: 'deployment-gpt-5.1', label: 'GPT-5.1' },
      { value: 'deployment-gpt-5', label: 'GPT-5' },
      { value: 'deployment-gpt-5-mini', label: 'GPT-5 mini' },
      { value: 'deployment-gpt-5-nano', label: 'GPT-5 nano' },
      { value: 'deployment-gpt-4o', label: 'GPT-4o', reasoning: false },
      { value: 'deployment-gpt-4o-mini', label: 'GPT-4o mini', reasoning: false },
      { value: 'deployment-gpt-4.1', label: 'GPT-4.1', reasoning: false },
      { value: 'deployment-gpt-4.1-mini', label: 'GPT-4.1 mini', reasoning: false },
    ],
    providerCreator: createAzure,
  },
  {
    value: 'SiliconFlow' as const,
    children: [
      { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek V3', vision: false, reasoning: false },
      { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1', vision: false, reasoning: false },
      { value: 'Qwen/Qwen2-VL-72B-Instruct', label: 'Qwen2 VL 72B Instruct', reasoning: false },
      { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen2.5 72B Instruct', vision: false, reasoning: false },
    ],
    providerCreator: createOpenAI,
  },
  {
    value: 'Alibaba',
    children: [
      { value: 'qwen3.7-max', label: 'Qwen3.7 Max', vision: false },
      { value: 'qwen3-max', label: 'Qwen3 Max', vision: false },
      { value: 'qwen-plus', label: 'Qwen Plus', vision: false },
      { value: 'qwen-flash', label: 'Qwen Flash', vision: false },
      { value: 'qwen3-coder-plus', label: 'Qwen3 Coder Plus', vision: false },
      { value: 'qwen3-235b-a22b', label: 'Qwen3 235B A22B', vision: false },
    ],
    providerCreator: createAlibaba,
  },
  {
    value: 'Mistral',
    children: [
      { value: 'mistral-large-latest', label: 'Mistral Large', vision: false, reasoning: false },
      { value: 'mistral-medium-latest', label: 'Mistral Medium', vision: false },
      { value: 'magistral-medium-latest', label: 'Magistral Medium', vision: false },
      { value: 'codestral-latest', label: 'Codestral', vision: false, reasoning: false },
      { value: 'ministral-8b-latest', label: 'Ministral 8B', vision: false, reasoning: false },
    ],
    providerCreator: createMistral,
  },
  {
    value: 'Groq',
    children: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', vision: false, reasoning: false },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', vision: false, reasoning: false },
      { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', vision: false },
      { value: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', vision: false },
      {
        value: 'moonshotai/kimi-k2-instruct-0905',
        label: 'Kimi K2 Instruct',
        vision: false,
        reasoning: false,
      },
      {
        value: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        label: 'Llama 4 Maverick',
        reasoning: false,
      },
    ],
    providerCreator: createGroq,
  },
  {
    value: 'Cohere',
    children: [
      { value: 'command-a-03-2025', label: 'Command A', vision: false, reasoning: false },
      { value: 'command-a-reasoning-08-2025', label: 'Command A Reasoning', vision: false },
      { value: 'command-a-vision-07-2025', label: 'Command A Vision', reasoning: false },
      { value: 'command-r7b-12-2024', label: 'Command R7B', vision: false, reasoning: false },
      { value: 'command-r-plus', label: 'Command R+', vision: false, reasoning: false },
    ],
    providerCreator: createCohere,
  },
  {
    value: 'Together AI',
    children: [
      {
        value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        label: 'Llama 3.3 70B Instruct Turbo',
        vision: false,
        reasoning: false,
      },
      { value: 'deepseek-ai/DeepSeek-V4-Flash-0731', label: 'DeepSeek V4 Flash', vision: false },
      {
        value: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        label: 'Qwen2.5 72B Instruct Turbo',
        vision: false,
        reasoning: false,
      },
      {
        value: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
        label: 'Mixtral 8x22B Instruct',
        vision: false,
        reasoning: false,
      },
      { value: 'google/gemma-2-27b-it', label: 'Gemma 2 27B', vision: false, reasoning: false },
    ],
    providerCreator: createTogetherAI,
  },
  {
    value: 'Fireworks',
    children: [
      { value: 'accounts/fireworks/models/deepseek-v3', label: 'DeepSeek V3', vision: false, reasoning: false },
      {
        value: 'accounts/fireworks/models/kimi-k2-instruct',
        label: 'Kimi K2 Instruct',
        vision: false,
        reasoning: false,
      },
      {
        value: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        label: 'Llama 3.3 70B Instruct',
        vision: false,
        reasoning: false,
      },
      { value: 'accounts/fireworks/models/qwen2-vl-72b-instruct', label: 'Qwen2 VL 72B Instruct', reasoning: false },
      {
        value: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
        label: 'Llama 3.2 11B Vision',
        reasoning: false,
      },
      { value: 'accounts/fireworks/models/minimax-m2', label: 'MiniMax M2', vision: false },
    ],
    providerCreator: createFireworks,
  },
  {
    value: 'DeepInfra',
    children: [
      { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B Instruct', vision: false, reasoning: false },
      { value: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', label: 'Llama 4 Maverick', reasoning: false },
      { value: 'meta-llama/Llama-3.2-90B-Vision-Instruct', label: 'Llama 3.2 90B Vision', reasoning: false },
      {
        value: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen2.5 Coder 32B Instruct',
        vision: false,
        reasoning: false,
      },
      {
        value: 'mistralai/Mistral-Nemo-Instruct-2407',
        label: 'Mistral Nemo Instruct',
        vision: false,
        reasoning: false,
      },
    ],
    providerCreator: createDeepInfra,
  },
  {
    value: 'Cerebras',
    children: [
      { value: 'gpt-oss-120b', label: 'GPT-OSS 120B', vision: false },
      { value: 'qwen-3.8-27b', label: 'Qwen 3.8 27B' },
    ],
    providerCreator: createCerebras,
  },
  {
    value: 'Moonshot AI',
    children: [
      { value: 'kimi-k3', label: 'Kimi K3', vision: false },
      { value: 'kimi-k2.6', label: 'Kimi K2.6', vision: false },
      { value: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', vision: false },
      { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K', vision: false, reasoning: false },
      { value: 'moonshot-v1-8k-vision-preview', label: 'Moonshot v1 8K Vision', reasoning: false },
    ],
    providerCreator: createMoonshotAI,
  },
  {
    value: 'MiniMax',
    children: [
      { value: 'minimax-m3', label: 'MiniMax M3', vision: false },
      { value: 'minimax-m2.7', label: 'MiniMax M2.7', vision: false },
      { value: 'minimax-m2.5', label: 'MiniMax M2.5', vision: false },
      { value: 'minimax-m2.1', label: 'MiniMax M2.1', vision: false },
      { value: 'minimax-m2', label: 'MiniMax M2', vision: false },
    ],
    providerCreator: createMiniMax,
  },
  {
    value: 'Z.AI',
    children: [
      { value: 'glm-5.3', label: 'GLM-5.3', vision: false },
      { value: 'glm-5', label: 'GLM-5', vision: false },
      { value: 'glm-4.7', label: 'GLM-4.7', vision: false },
      { value: 'glm-4.6', label: 'GLM-4.6', vision: false },
      { value: 'glm-4.6v', label: 'GLM-4.6V' },
    ],
    providerCreator: createZai,
  },
  {
    value: 'Perplexity',
    children: [
      { value: 'perplexity/sonar', label: 'Perplexity Sonar', vision: false },
      { value: 'fast', label: 'Perplexity Agent (fast)', vision: false },
      { value: 'low', label: 'Perplexity Agent (low)', vision: false },
      { value: 'medium', label: 'Perplexity Agent (medium)', vision: false },
      { value: 'high', label: 'Perplexity Agent (high)', vision: false },
      { value: 'xhigh', label: 'Perplexity Agent (xhigh)', vision: false },
    ],
    providerCreator: createPerplexity,
  },
  {
    value: 'Vercel AI Gateway',
    children: [
      { value: 'openai/gpt-5.2', label: 'GPT-5.2' },
      { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
      { value: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { value: 'spacexai/grok-4.3', label: 'Grok 4.3' },
      { value: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
      { value: 'meta/llama-4-maverick', label: 'Llama 4 Maverick' },
    ],
    providerCreator: createGateway,
  },
]

/**
 * Returns the display name of a model, falling back to the raw id for custom models.
 */
export const getModelLabel = (model: string): string => {
  for (const provider of AImodelsOptions) {
    const option = provider.children.find((child) => child.value === model)
    if (option) return option.label
  }
  return model
}

/**
 * Whether a model accepts images. Only models explicitly marked `vision: false` are rejected;
 * models the user typed themselves are assumed to support images.
 */
export const supportsImages = (model: string): boolean => {
  for (const provider of AImodelsOptions) {
    const option = provider.children.find((child) => child.value === model)
    if (option) return option.vision !== false
  }
  return true
}

/**
 * Whether a reasoning strength can be asked of a model. Only models explicitly marked
 * `reasoning: false` are rejected; models the user typed themselves are assumed to support it.
 * The level itself is sent through the AI SDK's unified `reasoning` call option.
 */
export const supportsReasoning = (model: string): boolean => {
  for (const provider of AImodelsOptions) {
    const option = provider.children.find((child) => child.value === model)
    if (option) return option.reasoning !== false
  }
  return true
}

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
  { value: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' },
  { value: 'https://api.mistral.ai/v1' },
  { value: 'https://api.groq.com/openai/v1' },
  { value: 'https://api.cohere.com/v2' },
  { value: 'https://api.together.xyz/v1' },
  { value: 'https://api.fireworks.ai/inference/v1' },
  { value: 'https://api.deepinfra.com/v1' },
  { value: 'https://api.cerebras.ai/v1' },
  { value: 'https://api.moonshot.ai/v1' },
  { value: 'https://api.minimax.io/anthropic/v1' },
  { value: 'https://api.z.ai/api/paas/v4' },
  { value: 'https://api.perplexity.ai' },
  { value: 'https://ai-gateway.vercel.sh/v4/ai' },
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
