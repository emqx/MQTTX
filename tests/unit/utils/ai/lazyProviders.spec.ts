import { expect } from 'chai'
import type { LanguageModelV4 } from '@ai-sdk/provider'

const factories = {
  OpenAI: [require.resolve('@ai-sdk/openai'), 'createOpenAI'],
  DeepSeek: [require.resolve('@ai-sdk/deepseek'), 'createDeepSeek'],
  Anthropic: [require.resolve('@ai-sdk/anthropic'), 'createAnthropic'],
  xAI: [require.resolve('@ai-sdk/xai'), 'createXai'],
  Google: [require.resolve('@ai-sdk/google'), 'createGoogleGenerativeAI'],
  'Azure OpenAI': [require.resolve('@ai-sdk/azure'), 'createAzure'],
  SiliconFlow: [require.resolve('@ai-sdk/openai'), 'createOpenAI'],
  Alibaba: [require.resolve('@ai-sdk/alibaba'), 'createAlibaba'],
  Mistral: [require.resolve('@ai-sdk/mistral'), 'createMistral'],
  Groq: [require.resolve('@ai-sdk/groq'), 'createGroq'],
  Cohere: [require.resolve('@ai-sdk/cohere'), 'createCohere'],
  'Together AI': [require.resolve('@ai-sdk/togetherai'), 'createTogetherAI'],
  Fireworks: [require.resolve('@ai-sdk/fireworks'), 'createFireworks'],
  DeepInfra: [require.resolve('@ai-sdk/deepinfra'), 'createDeepInfra'],
  Cerebras: [require.resolve('@ai-sdk/cerebras'), 'createCerebras'],
  'Moonshot AI': [require.resolve('@ai-sdk/moonshotai'), 'createMoonshotAI'],
  MiniMax: [require.resolve('@ai-sdk/minimax'), 'createMiniMax'],
  'Z.AI': [require.resolve('@ai-sdk/zai'), 'createZai'],
  Perplexity: [require.resolve('@ai-sdk/perplexity'), 'createPerplexity'],
  'Vercel AI Gateway': [require.resolve('@ai-sdk/gateway'), 'createGateway'],
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

  it('resolves each factory on first use and preserves eager provider requests', async () => {
    const { AImodelsOptions, getModelProvider } = require('@/utils/ai/models') as typeof import('@/utils/ai/models')
    expectNoProvidersLoaded()

    const requests: Array<{ url: string; method: string | undefined; headers: Record<string, string>; body: unknown }> =
      []
    const mockFetch: typeof fetch = async (input, init) => {
      requests.push({
        url: input.toString(),
        method: init?.method,
        headers: Object.fromEntries(new Headers(init?.headers)),
        body: init?.body,
      })
      throw new Error('mock fetch: no network')
    }
    const options = {
      baseURL: 'https://provider.example.test/custom/',
      apiKey: 'test-api-key',
      headers: { 'x-test-header': 'preserved' },
      fetch: mockFetch,
    }
    const callOptions = {
      prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'hello' }] }],
    }

    for (const entry of AImodelsOptions) {
      const [moduleId, factoryName] = factories[entry.value]
      // SiliconFlow shares OpenAI; evict the entry point again to check its wrapper too.
      delete require.cache[moduleId]
      const provider = entry.providerCreator(options)
      expect(require.cache[moduleId], `${entry.value} resolves its factory`).not.to.equal(undefined)
      const eagerProvider = __webpack_require__(moduleId)[factoryName](options)
      expect(typeof provider, entry.value).to.equal(typeof eagerProvider)
      expect(provider.languageModel, entry.value).to.be.a('function')
      expect(Object.keys(provider), entry.value).to.deep.equal(Object.keys(eagerProvider))

      const modelId = entry.children[0].value
      const model: LanguageModelV4 = provider.languageModel(modelId)
      const eagerModel: LanguageModelV4 = eagerProvider.languageModel(modelId)
      expect(model.provider, entry.value).to.equal(eagerModel.provider)
      expect(model.modelId, entry.value).to.equal(eagerModel.modelId)
      expect(model.specificationVersion, entry.value).to.equal(eagerModel.specificationVersion)
      requests.length = 0
      await Promise.resolve(model.doGenerate(callOptions)).catch(() => undefined)
      await Promise.resolve(eagerModel.doGenerate(callOptions)).catch(() => undefined)
      expect(requests, `${entry.value} reaches mock fetch twice`).to.have.length(2)
      expect(requests[0], entry.value).to.deep.equal(requests[1])
      expect(requests[0].url, entry.value).to.include('https://provider.example.test/custom')
      expect(requests[0].headers['x-test-header'], entry.value).to.equal('preserved')
    }

    const [openaiId, factoryName] = factories.OpenAI
    delete require.cache[openaiId]
    const originalWarn = console.warn
    const originalFetch = globalThis.fetch
    console.warn = () => undefined
    globalThis.fetch = mockFetch
    try {
      const modelId = AImodelsOptions[0].children[0].value
      const model = getModelProvider({
        model: modelId,
        apiKey: options.apiKey,
        baseURL: options.baseURL,
        providerType: 'unsupported' as any,
      })
      expect(require.cache[openaiId], 'fallback resolves OpenAI on first use').not.to.equal(undefined)
      const eagerModel = __webpack_require__(openaiId)[factoryName]({ apiKey: options.apiKey }).chat(modelId)
      expect(model.provider).to.equal(eagerModel.provider)
      expect(model.modelId).to.equal(eagerModel.modelId)
      expect(model.specificationVersion).to.equal(eagerModel.specificationVersion)
      requests.length = 0
      await Promise.resolve(model.doGenerate(callOptions)).catch(() => undefined)
      await Promise.resolve(eagerModel.doGenerate(callOptions)).catch(() => undefined)
      expect(requests, 'fallback reaches mock fetch twice').to.have.length(2)
      expect(requests[0]).to.deep.equal(requests[1])
    } finally {
      console.warn = originalWarn
      globalThis.fetch = originalFetch
    }
  })
})
