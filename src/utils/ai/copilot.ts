import { AIModel, AImodelsOptionsModel } from '@/types/copilot'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import basePrompt from './prompts/base.txt'
import clientCodeGen from './prompts/clientCodeGen.txt'
import payloadGen from './prompts/payloadGen.txt'
import emqxGuide from './prompts/emqxGuide.txt'
import mqttFaq from './prompts/mqttFaq.txt'
import funcGen from './prompts/funcGen.txt'
import protobufSchemaGen from './prompts/protobufSchemaGen.txt'
import avroSchemaGen from './prompts/avroSchemaGen.txt'
import mcpPrompt from './prompts/mcp.txt'
import mcpResultAnalysis from './prompts/mcpResultAnalysis.txt'
import { MCPPromptData } from '@/types/mcp'
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
import { getCopilotMessageId } from '../idGenerator'

export const LANGUAGE_MAP = {
  zh: '请使用中文回答（简体中文）',
  en: 'Please answer in English（English）',
  tr: 'Lütfen Türkçe cevap verin（Turkish）',
  ja: '日本語で回答してください（Japanese）',
  hu: 'Kérjük, magyarul válaszoljon（Hungarian）',
}

export const loadSystemPrompt = (lang: Language, command?: string, mcpData?: MCPPromptData) => {
  let _basePrompt = basePrompt

  // Add MCP system prompt if MCP is enabled and available
  if (mcpData && mcpData.hasMCP) {
    let mcpSystemPrompt = mcpPrompt
      .replace('{{SERVERS_SECTION}}', mcpData.serversSection)
      .replace('{{TOOLS_SECTION}}', mcpData.toolsSection)
    _basePrompt = `${_basePrompt}\n\n${mcpSystemPrompt}`
  }

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
    value: 'OpenAI' as const,
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
    value: 'DeepSeek' as const,
    children: [{ value: 'deepseek-chat' }, { value: 'deepseek-reasoner' }],
    providerCreator: createDeepSeek,
  },
  {
    value: 'Anthropic',
    children: [
      { value: 'claude-3-7-sonnet-20250219' },
      { value: 'claude-3-7-sonnet-20250219-thinking' },
      { value: 'claude-3-5-sonnet-latest' },
      { value: 'claude-3-5-haiku-latest' },
      { value: 'claude-3-opus-latest' },
      { value: 'claude-3-haiku-20240307' },
    ],
    providerCreator: createAnthropic,
  },
  {
    value: 'xAI' as const,
    children: [
      { value: 'grok-2-1212' },
      { value: 'grok-3-mini-fast-beta' },
      { value: 'grok-3-mini-beta' },
      { value: 'grok-3-fast-beta' },
      { value: 'grok-3-beta' },
    ],
    providerCreator: createXai,
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

export const REASONING_MODEL_REGEX = /thinking|reasoner|r1/i

/**
 * Determines if the provided model is a reasoning-capable model.
 *
 * @param model - The AI model to check
 * @returns True if the model supports reasoning capabilities, false otherwise
 */
export const isReasoningModel = (model: AIModel) => {
  return REASONING_MODEL_REGEX.test(model)
}

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

export const buildMCPAnalysisMessages = (
  currentLang: Language,
  firstUserMessage: string,
  assistantContent: string,
  userPrompt: string,
): CopilotMessage[] => {
  const systemPrompt = `${mcpResultAnalysis}\n\n${LANGUAGE_MAP[currentLang]}`
  return [
    { id: getCopilotMessageId(), role: 'system', content: systemPrompt },
    { id: getCopilotMessageId(), role: 'user', content: firstUserMessage },
    { id: getCopilotMessageId(), role: 'assistant', content: assistantContent },
    { id: getCopilotMessageId(), role: 'user', content: userPrompt },
  ]
}

/**
 * Returns the conditions for determining when to continue or stop MCP analysis.
 *
 * @returns An object containing two functions:
 *   - shouldContinue: Function that returns true if analysis should continue
 *   - stopCondition: Function that returns true if analysis should stop
 */
export const getMCPAnalysisConditions = () => {
  const COMPLETION_MARKERS = ['[DONE]']

  const shouldContinue = (content: string) =>
    content.includes('mcp-result') && !COMPLETION_MARKERS.some((marker) => content.includes(marker))

  const stopCondition = (content: string) =>
    COMPLETION_MARKERS.some((marker) => content.includes(marker)) || !shouldContinue(content)

  return {
    shouldContinue,
    stopCondition,
  }
}
