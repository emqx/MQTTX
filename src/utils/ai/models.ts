import { AIModel, AImodelsOptionsModel, ReasoningEffort } from '@/types/agent'
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

// Reasoning values a model honours, for `reasoningEfforts`. A model without the list takes every level,
// because its provider package maps each one itself.
/** GPT-5, GPT-5 mini and GPT-5 nano: they cannot turn reasoning off */
const GPT_5_EFFORTS: ReasoningEffort[] = ['minimal', 'low', 'medium', 'high']
/** GPT-5.1 added `none` */
const GPT_5_1_EFFORTS: ReasoningEffort[] = ['none', 'low', 'medium', 'high']
/** GPT-5.2 and later added `xhigh` */
const GPT_5_2_EFFORTS: ReasoningEffort[] = ['none', 'low', 'medium', 'high', 'xhigh']
/** The `reasoning_effort` values OpenAI-compatible servers accept for their reasoning models */
const COMPATIBLE_EFFORTS: ReasoningEffort[] = ['low', 'medium', 'high']
/** Models that can only turn thinking on or off */
const ON_OFF_EFFORTS: ReasoningEffort[] = ['none', 'high']
/** DeepSeek V4 maps Medium to High */
const DEEPSEEK_EFFORTS: ReasoningEffort[] = ['none', 'low', 'high', 'max']
/** Gemini 3 cannot turn thinking off; `none` only lowers it to the minimum level */
const GEMINI_3_EFFORTS: ReasoningEffort[] = ['minimal', 'low', 'medium', 'high']
/** Perplexity cannot turn reasoning off */
const PERPLEXITY_EFFORTS: ReasoningEffort[] = ['low', 'medium', 'high', 'xhigh']

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
      { value: 'gpt-6-luna', label: 'GPT-6 Luna', contextWindow: 1050000 },
      { value: 'gpt-5.4', label: 'GPT-5.4', reasoningEfforts: GPT_5_2_EFFORTS, contextWindow: 1050000 },
      { value: 'gpt-5.2', label: 'GPT-5.2', reasoningEfforts: GPT_5_2_EFFORTS, contextWindow: 400000 },
      { value: 'gpt-5.1', label: 'GPT-5.1', reasoningEfforts: GPT_5_1_EFFORTS, contextWindow: 400000 },
      { value: 'gpt-5', label: 'GPT-5', reasoningEfforts: GPT_5_EFFORTS, contextWindow: 400000 },
      { value: 'gpt-5-mini', label: 'GPT-5 mini', reasoningEfforts: GPT_5_EFFORTS, contextWindow: 400000 },
      { value: 'gpt-5-nano', label: 'GPT-5 nano', reasoningEfforts: GPT_5_EFFORTS, contextWindow: 400000 },
      { value: 'gpt-4o', label: 'GPT-4o', reasoning: false, contextWindow: 128000 },
      { value: 'gpt-4o-mini', label: 'GPT-4o mini', reasoning: false, contextWindow: 128000 },
      { value: 'gpt-4.1', label: 'GPT-4.1', reasoning: false, contextWindow: 1047576 },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini', reasoning: false, contextWindow: 1047576 },
    ],
    providerCreator: createOpenAI,
  },
  {
    value: 'DeepSeek' as const,
    children: [
      {
        value: 'deepseek-flash',
        label: 'DeepSeek V4.1 Flash',
        reasoningEfforts: DEEPSEEK_EFFORTS,
        contextWindow: 1000000,
      },
      {
        value: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        vision: false,
        reasoningEfforts: DEEPSEEK_EFFORTS,
        contextWindow: 1000000,
      },
    ],
    providerCreator: createDeepSeek,
  },
  {
    value: 'Anthropic',
    children: [
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', contextWindow: 1000000 },
      { value: 'claude-opus-4-7', label: 'Claude Opus 4.7', contextWindow: 1000000 },
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', contextWindow: 1000000 },
      { value: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5', contextWindow: 200000 },
      { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', contextWindow: 200000 },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', contextWindow: 200000 },
    ],
    providerCreator: createAnthropic,
  },
  {
    value: 'xAI' as const,
    children: [
      { value: 'grok-4.20-reasoning', label: 'Grok 4.20 Reasoning', reasoning: false, contextWindow: 1000000 },
      { value: 'grok-4.20-non-reasoning', label: 'Grok 4.20', reasoning: false, contextWindow: 1000000 },
      { value: 'grok-4.7', label: 'Grok 4.7', contextWindow: 500000 },
      { value: 'grok-4.6', label: 'Grok 4.6', contextWindow: 500000 },
      { value: 'grok-4.5', label: 'Grok 4.5', contextWindow: 500000 },
      { value: 'grok-4.3', label: 'Grok 4.3', contextWindow: 1000000 },
    ],
    providerCreator: createXai,
  },
  {
    value: 'Google' as const,
    children: [
      {
        value: 'gemini-3.8-flash',
        label: 'Gemini 3.8 Flash',
        reasoningEfforts: GEMINI_3_EFFORTS,
        contextWindow: 1048576,
      },
      {
        value: 'gemini-3.5-flash',
        label: 'Gemini 3.5 Flash',
        reasoningEfforts: GEMINI_3_EFFORTS,
        contextWindow: 1048576,
      },
      // Gemini 2.5 Pro only works in thinking mode, so it has no Off
      {
        value: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        reasoningEfforts: ['low', 'medium', 'high', 'max'],
        contextWindow: 1048576,
      },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', contextWindow: 1048576 },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', contextWindow: 1048576 },
    ],
    providerCreator: createGoogleGenerativeAI,
  },
  {
    value: 'Azure OpenAI' as const,
    children: [
      { value: 'deployment-gpt-6-luna', label: 'GPT-6 Luna', contextWindow: 1050000 },
      { value: 'deployment-gpt-5.4', label: 'GPT-5.4', reasoningEfforts: GPT_5_2_EFFORTS, contextWindow: 1050000 },
      { value: 'deployment-gpt-5.2', label: 'GPT-5.2', reasoningEfforts: GPT_5_2_EFFORTS, contextWindow: 400000 },
      { value: 'deployment-gpt-5.1', label: 'GPT-5.1', reasoningEfforts: GPT_5_1_EFFORTS, contextWindow: 400000 },
      { value: 'deployment-gpt-5', label: 'GPT-5', reasoningEfforts: GPT_5_EFFORTS, contextWindow: 400000 },
      { value: 'deployment-gpt-5-mini', label: 'GPT-5 mini', reasoningEfforts: GPT_5_EFFORTS, contextWindow: 400000 },
      { value: 'deployment-gpt-5-nano', label: 'GPT-5 nano', reasoningEfforts: GPT_5_EFFORTS, contextWindow: 400000 },
      { value: 'deployment-gpt-4o', label: 'GPT-4o', reasoning: false, contextWindow: 128000 },
      { value: 'deployment-gpt-4o-mini', label: 'GPT-4o mini', reasoning: false, contextWindow: 128000 },
      { value: 'deployment-gpt-4.1', label: 'GPT-4.1', reasoning: false, contextWindow: 1047576 },
      { value: 'deployment-gpt-4.1-mini', label: 'GPT-4.1 mini', reasoning: false, contextWindow: 1047576 },
    ],
    providerCreator: createAzure,
  },
  {
    value: 'SiliconFlow' as const,
    children: [
      {
        value: 'deepseek-ai/DeepSeek-V3',
        label: 'DeepSeek V3',
        vision: false,
        reasoning: false,
        contextWindow: 164000,
      },
      {
        value: 'deepseek-ai/DeepSeek-R1',
        label: 'DeepSeek R1',
        vision: false,
        reasoning: false,
        contextWindow: 164000,
      },
      { value: 'Qwen/Qwen2-VL-72B-Instruct', label: 'Qwen2 VL 72B Instruct', reasoning: false },
      {
        value: 'Qwen/Qwen2.5-72B-Instruct',
        label: 'Qwen2.5 72B Instruct',
        vision: false,
        reasoning: false,
        contextWindow: 33000,
      },
    ],
    providerCreator: createOpenAI,
  },
  {
    value: 'Alibaba',
    children: [
      { value: 'qwen3.7-max', label: 'Qwen3.7 Max', vision: false, contextWindow: 1000000 },
      { value: 'qwen3-max', label: 'Qwen3 Max', vision: false, contextWindow: 262144 },
      { value: 'qwen-plus', label: 'Qwen Plus', vision: false, contextWindow: 1000000 },
      { value: 'qwen-flash', label: 'Qwen Flash', vision: false, contextWindow: 1000000 },
      { value: 'qwen3-coder-plus', label: 'Qwen3 Coder Plus', vision: false, contextWindow: 1048576 },
      { value: 'qwen3-235b-a22b', label: 'Qwen3 235B A22B', vision: false, contextWindow: 131072 },
    ],
    providerCreator: createAlibaba,
  },
  {
    value: 'Mistral',
    children: [
      { value: 'mistral-large-latest', label: 'Mistral Large', vision: false, reasoning: false, contextWindow: 262144 },
      {
        value: 'mistral-medium-latest',
        label: 'Mistral Medium',
        vision: false,
        reasoningEfforts: ON_OFF_EFFORTS,
        contextWindow: 262144,
      },
      {
        value: 'magistral-medium-latest',
        label: 'Magistral Medium',
        vision: false,
        reasoningEfforts: ON_OFF_EFFORTS,
        contextWindow: 262144,
      },
      { value: 'codestral-latest', label: 'Codestral', vision: false, reasoning: false, contextWindow: 256000 },
      { value: 'ministral-8b-latest', label: 'Ministral 8B', vision: false, reasoning: false, contextWindow: 262144 },
    ],
    providerCreator: createMistral,
  },
  {
    value: 'Groq',
    children: [
      {
        value: 'openai/gpt-oss-120b',
        label: 'GPT-OSS 120B',
        vision: false,
        reasoningEfforts: COMPATIBLE_EFFORTS,
        contextWindow: 131072,
      },
      {
        value: 'openai/gpt-oss-20b',
        label: 'GPT-OSS 20B',
        vision: false,
        reasoningEfforts: COMPATIBLE_EFFORTS,
        contextWindow: 131072,
      },
      {
        value: 'qwen/qwen3.8-27b',
        label: 'Qwen3.8 27B',
        reasoningEfforts: COMPATIBLE_EFFORTS,
        contextWindow: 131042,
      },
      {
        value: 'llama-3.3-70b-versatile',
        label: 'Llama 3.3 70B Versatile',
        vision: false,
        reasoning: false,
        contextWindow: 131072,
      },
      {
        value: 'llama-3.1-8b-instant',
        label: 'Llama 3.1 8B Instant',
        vision: false,
        reasoning: false,
        contextWindow: 131072,
      },
    ],
    providerCreator: createGroq,
  },
  {
    value: 'Cohere',
    children: [
      { value: 'command-a-03-2025', label: 'Command A', vision: false, reasoning: false, contextWindow: 256000 },
      { value: 'command-a-reasoning-08-2025', label: 'Command A Reasoning', vision: false, contextWindow: 256000 },
      { value: 'command-a-vision-07-2025', label: 'Command A Vision', reasoning: false, contextWindow: 128000 },
      { value: 'command-r7b-12-2024', label: 'Command R7B', vision: false, reasoning: false, contextWindow: 128000 },
      { value: 'command-r-plus', label: 'Command R+', vision: false, reasoning: false },
    ],
    providerCreator: createCohere,
  },
  {
    value: 'Together AI',
    children: [
      {
        value: 'deepseek-ai/DeepSeek-V4.1-Flash',
        label: 'DeepSeek V4.1 Flash',
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'moonshotai/Kimi-K3',
        label: 'Kimi K3',
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'zai-org/GLM-5.3',
        label: 'GLM-5.3',
        vision: false,
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'MiniMaxAI/MiniMax-M3',
        label: 'MiniMax M3',
        reasoning: false,
        contextWindow: 524288,
      },
      {
        value: 'Qwen/Qwen3.7-Max',
        label: 'Qwen3.7 Max',
        vision: false,
        reasoning: false,
        contextWindow: 1000000,
      },
      {
        value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        label: 'Llama 3.3 70B Instruct Turbo',
        vision: false,
        reasoning: false,
        contextWindow: 131072,
      },
    ],
    providerCreator: createTogetherAI,
  },
  {
    value: 'Fireworks',
    children: [
      {
        value: 'accounts/fireworks/models/deepseek-v4p1-flash',
        label: 'DeepSeek V4.1 Flash',
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1000000,
      },
      {
        value: 'accounts/fireworks/models/kimi-k3',
        label: 'Kimi K3',
        reasoningEfforts: ['low', 'medium', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'accounts/fireworks/models/glm-5p3',
        label: 'GLM-5.3',
        vision: false,
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048573,
      },
      {
        value: 'accounts/fireworks/models/glm-5p3-flash',
        label: 'GLM-5.3 Flash',
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048573,
      },
      {
        value: 'accounts/fireworks/models/qwen3p8-max',
        label: 'Qwen3.8 Max',
        reasoningEfforts: ON_OFF_EFFORTS,
        contextWindow: 262144,
      },
      {
        value: 'accounts/fireworks/models/minimax-m3',
        label: 'MiniMax M3',
        vision: false,
        reasoningEfforts: COMPATIBLE_EFFORTS,
        contextWindow: 512000,
      },
    ],
    providerCreator: createFireworks,
  },
  {
    value: 'DeepInfra',
    children: [
      {
        value: 'deepseek-ai/DeepSeek-V4.1-Flash-1017',
        label: 'DeepSeek V4.1 Flash 1017',
        reasoningEfforts: DEEPSEEK_EFFORTS,
        contextWindow: 1048576,
      },
      {
        value: 'deepseek-ai/DeepSeek-V4-Pro-0813',
        label: 'DeepSeek V4 Pro',
        vision: false,
        reasoningEfforts: ['none', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'XiaomiMiMo/MiMo-V2.6-Pro',
        label: 'MiMo V2.6 Pro',
        reasoningEfforts: ON_OFF_EFFORTS,
        contextWindow: 1048576,
      },
      {
        value: 'zai-org/GLM-5.3-Flash',
        label: 'GLM-5.3 Flash',
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'Qwen/Qwen3.8-27B',
        label: 'Qwen3.8 27B',
        reasoningEfforts: ['none', 'low', 'medium', 'xhigh'],
        contextWindow: 262144,
      },
      {
        value: 'google/gemma-4-31B-it',
        label: 'Gemma 4 31B',
        reasoningEfforts: ON_OFF_EFFORTS,
        contextWindow: 262144,
      },
    ],
    providerCreator: createDeepInfra,
  },
  {
    value: 'Cerebras',
    children: [
      {
        value: 'gpt-oss-120b',
        label: 'GPT-OSS 120B',
        vision: false,
        reasoningEfforts: COMPATIBLE_EFFORTS,
        contextWindow: 131072,
      },
      { value: 'qwen-3.8-27b', label: 'Qwen 3.8 27B', reasoningEfforts: COMPATIBLE_EFFORTS, contextWindow: 131072 },
    ],
    providerCreator: createCerebras,
  },
  {
    value: 'Moonshot AI',
    children: [
      {
        value: 'kimi-k3',
        label: 'Kimi K3',
        vision: false,
        reasoningEfforts: ['low', 'high', 'max'],
        contextWindow: 1048576,
      },
      {
        value: 'kimi-k2.6',
        label: 'Kimi K2.6',
        vision: false,
        reasoningEfforts: ON_OFF_EFFORTS,
        contextWindow: 262144,
      },
      // Always thinks and takes no effort
      { value: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', vision: false, reasoning: false, contextWindow: 262144 },
      { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K', vision: false, reasoning: false },
      { value: 'moonshot-v1-8k-vision-preview', label: 'Moonshot v1 8K Vision', reasoning: false },
    ],
    providerCreator: createMoonshotAI,
  },
  {
    value: 'MiniMax',
    children: [
      { value: 'minimax-m3', label: 'MiniMax M3', vision: false, contextWindow: 1000000 },
      { value: 'minimax-m2.7', label: 'MiniMax M2.7', vision: false, contextWindow: 204800 },
      { value: 'minimax-m2.5', label: 'MiniMax M2.5', vision: false, contextWindow: 204800 },
      { value: 'minimax-m2.1', label: 'MiniMax M2.1', vision: false, contextWindow: 204800 },
      { value: 'minimax-m2', label: 'MiniMax M2', vision: false, contextWindow: 204800 },
    ],
    providerCreator: createMiniMax,
  },
  {
    value: 'Z.AI',
    children: [
      { value: 'glm-5.3', label: 'GLM-5.3', vision: false, contextWindow: 1000000 },
      // Before GLM-5.2, Z.AI only turns thinking on or off
      { value: 'glm-5', label: 'GLM-5', vision: false, reasoningEfforts: ON_OFF_EFFORTS, contextWindow: 204800 },
      { value: 'glm-4.7', label: 'GLM-4.7', vision: false, reasoningEfforts: ON_OFF_EFFORTS, contextWindow: 204800 },
      { value: 'glm-4.6', label: 'GLM-4.6', vision: false, reasoningEfforts: ON_OFF_EFFORTS, contextWindow: 204800 },
      { value: 'glm-4.6v', label: 'GLM-4.6V', reasoningEfforts: ON_OFF_EFFORTS, contextWindow: 128000 },
    ],
    providerCreator: createZai,
  },
  {
    value: 'Perplexity',
    children: [
      {
        value: 'perplexity/sonar',
        label: 'Perplexity Sonar',
        vision: false,
        reasoningEfforts: PERPLEXITY_EFFORTS,
        contextWindow: 128000,
      },
      { value: 'fast', label: 'Perplexity Agent (fast)', vision: false, reasoningEfforts: PERPLEXITY_EFFORTS },
      { value: 'low', label: 'Perplexity Agent (low)', vision: false, reasoningEfforts: PERPLEXITY_EFFORTS },
      { value: 'medium', label: 'Perplexity Agent (medium)', vision: false, reasoningEfforts: PERPLEXITY_EFFORTS },
      { value: 'high', label: 'Perplexity Agent (high)', vision: false, reasoningEfforts: PERPLEXITY_EFFORTS },
      { value: 'xhigh', label: 'Perplexity Agent (xhigh)', vision: false, reasoningEfforts: PERPLEXITY_EFFORTS },
    ],
    providerCreator: createPerplexity,
  },
  {
    value: 'Vercel AI Gateway',
    children: [
      { value: 'openai/gpt-5.2', label: 'GPT-5.2', contextWindow: 400000 },
      { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5', contextWindow: 200000 },
      { value: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', contextWindow: 1000000 },
      { value: 'spacexai/grok-4.3', label: 'Grok 4.3', contextWindow: 1000000 },
      { value: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash', contextWindow: 1048576 },
      { value: 'meta/llama-4-maverick', label: 'Llama 4 Maverick', reasoning: false, contextWindow: 128000 },
    ],
    providerCreator: createGateway,
  },
]

/**
 * The provider entry and the model entry an id belongs to, or undefined for a model the user typed
 * themselves. Every lookup below goes through this one scan.
 */
export const findModelEntry = (
  model: string,
): { provider: AImodelsOptionsModel[number]; option: AImodelsOptionsModel[number]['children'][number] } | undefined => {
  for (const provider of AImodelsOptions) {
    const option = provider.children.find((child) => child.value === model)
    if (option) return { provider, option }
  }
  return undefined
}

/**
 * Returns the display name of a model, falling back to the raw id for custom models.
 */
export const getModelLabel = (model: string): string => findModelEntry(model)?.option.label ?? model

/**
 * Whether a model accepts images. Only models explicitly marked `vision: false` are rejected;
 * models the user typed themselves are assumed to support images.
 */
export const supportsImages = (model: string): boolean => findModelEntry(model)?.option.vision !== false

/**
 * Whether a reasoning strength can be asked of a model. Only models explicitly marked
 * `reasoning: false` are rejected; models the user typed themselves are assumed to support it.
 * The level itself is sent through the AI SDK's unified `reasoning` call option.
 */
export const supportsReasoning = (model: string): boolean => findModelEntry(model)?.option.reasoning !== false

/**
 * The reasoning values a model honours (`reasoningEfforts`); undefined when it takes every level or is
 * not one of the listed models.
 */
export const getReasoningEfforts = (model: string): readonly ReasoningEffort[] | undefined =>
  findModelEntry(model)?.option.reasoningEfforts

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
