import { expect } from 'chai'
import type { LanguageModelV4 } from '@ai-sdk/provider'

const factories: Record<string, string> = {
  OpenAI: require.resolve('@ai-sdk/openai'),
  DeepSeek: require.resolve('@ai-sdk/deepseek'),
  Anthropic: require.resolve('@ai-sdk/anthropic'),
  xAI: require.resolve('@ai-sdk/xai'),
  Google: require.resolve('@ai-sdk/google'),
  'Azure OpenAI': require.resolve('@ai-sdk/azure'),
  SiliconFlow: require.resolve('@ai-sdk/openai'),
  Alibaba: require.resolve('@ai-sdk/alibaba'),
  Mistral: require.resolve('@ai-sdk/mistral'),
  Groq: require.resolve('@ai-sdk/groq'),
  Cohere: require.resolve('@ai-sdk/cohere'),
  'Together AI': require.resolve('@ai-sdk/togetherai'),
  Fireworks: require.resolve('@ai-sdk/fireworks'),
  DeepInfra: require.resolve('@ai-sdk/deepinfra'),
  Cerebras: require.resolve('@ai-sdk/cerebras'),
  'Moonshot AI': require.resolve('@ai-sdk/moonshotai'),
  MiniMax: require.resolve('@ai-sdk/minimax'),
  'Z.AI': require.resolve('@ai-sdk/zai'),
  Perplexity: require.resolve('@ai-sdk/perplexity'),
  'Vercel AI Gateway': require.resolve('@ai-sdk/gateway'),
}

describe('lazy AI providers', () => {
  // mocha-webpack maps require.cache to its own module cache. Evict SDK modules (including
  // internal subpaths) so other specs importing models cannot hide an eager import here.
  const moduleIds = [
    require.resolve('@/utils/ai/models'),
    ...Object.keys(__webpack_modules__).filter((id) =>
      /node_modules[\\/]@ai-sdk[\\/](?!provider(?:-utils)?[\\/])/.test(id),
    ),
  ]
  let savedModules: Array<NodeModule | undefined>

  beforeEach(() => {
    savedModules = moduleIds.map((id) => require.cache[id])
    moduleIds.forEach((id) => delete require.cache[id])
  })

  afterEach(() => {
    moduleIds.forEach((id, index) => {
      delete require.cache[id]
      if (savedModules[index]) require.cache[id] = savedModules[index]
    })
  })

  const expectNoProvidersLoaded = () => {
    expect(moduleIds.slice(1), 'SDK modules included in the webpack bundle').not.to.be.empty
    expect(
      moduleIds.slice(1).filter((id) => require.cache[id]),
      'SDK modules evaluated during import',
    ).to.deep.equal([])
  }

  it('does not evaluate provider modules when importing models', () => {
    const { AImodelsOptions } = require('@/utils/ai/models') as typeof import('@/utils/ai/models')
    expect(AImodelsOptions).not.to.be.empty
    expectNoProvidersLoaded()
  })

  it('resolves each factory on first use', () => {
    const { AImodelsOptions } = require('@/utils/ai/models') as typeof import('@/utils/ai/models')
    expectNoProvidersLoaded()

    for (const entry of AImodelsOptions) {
      expect(factories[entry.value], `${entry.value} has a known SDK module`).to.exist
      const moduleId = factories[entry.value]
      // SiliconFlow shares OpenAI; evict the entry point again to check its wrapper too.
      delete require.cache[moduleId]

      const provider = entry.providerCreator({
        baseURL: 'https://provider.example.test/custom/',
        apiKey: 'test-api-key',
      })
      expect(require.cache[moduleId], `${entry.value} resolves its factory`).not.to.equal(undefined)

      const model: LanguageModelV4 = provider.languageModel(entry.children[0].value)
      expect(model.modelId, entry.value).to.equal(entry.children[0].value)
    }
  })

  it('resolves the OpenAI fallback on first use', () => {
    const { AImodelsOptions, getModelProvider } = require('@/utils/ai/models') as typeof import('@/utils/ai/models')
    expectNoProvidersLoaded()

    const openaiId = factories.OpenAI
    const originalWarn = console.warn
    console.warn = () => undefined
    try {
      const modelId = AImodelsOptions[0].children[0].value
      const model = getModelProvider({
        model: modelId,
        apiKey: 'test-api-key',
        baseURL: 'https://provider.example.test/custom/',
        providerType: 'unsupported' as any,
      })
      expect(require.cache[openaiId], 'fallback resolves OpenAI on first use').not.to.equal(undefined)
      expect(model.modelId).to.equal(modelId)
    } finally {
      console.warn = originalWarn
    }
  })
})
