import type { OpenAIProvider } from '@ai-sdk/openai'
import type { DeepSeekProvider } from '@ai-sdk/deepseek'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'

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

export type AImodelsOptionsModel = (OpenAIOptionsModel | DeepSeekOptionsModel)[]

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
  // {
  //   value: 'Moonshot',
  //   children: [{ value: 'moonshot-v1-8k' }, { value: 'moonshot-v1-32k' }, { value: 'moonshot-v1-128k' }],
  // },
]

export const AIAPIHostOptions = [
  {
    value: 'https://api.openai.com/v1',
  },
  {
    value: 'https://api.deepseek.com/v1',
  },
  {
    value: 'https://api.moonshot.cn/v1',
  },
]

export const getModelProvider = (opts: { model: AIModel; baseURL: string; apiKey: string }) => {
  const { model, baseURL, apiKey } = opts
  const currentModelOptions = AImodelsOptions.find((item) => item.children.some((child) => child.value === model))
  const providerCreator = currentModelOptions?.providerCreator || createOpenAI
  const provider = providerCreator({ baseURL, apiKey })
  return provider(model)
}

/**
 * Processes a stream of data from a response and invokes a callback function for each content received.
 * @param response - The response object containing the stream of data.
 * @param callBack - The callback function to be invoked for each content received.
 * @returns A promise that resolves to a boolean indicating the success of the stream processing.
 */
export const processStream = async (response: Response, callBack: (content: string) => void): Promise<boolean> => {
  const reader = response.body!.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    const chunkStr = new TextDecoder('utf-8').decode(value)
    const lines = chunkStr
      .split('\n')
      .filter((line) => line !== '' && line.length > 0)
      .map((line) => line.replace(/^data: /, '').trim())
      .filter((line) => line !== '[DONE]')
      .map((line) => JSON.parse(line))

    for (const line of lines) {
      const {
        choices: [
          {
            delta: { content },
          },
        ],
      } = line

      if (content) {
        callBack(content)
      }
    }
  }
  return Promise.resolve(true)
}
