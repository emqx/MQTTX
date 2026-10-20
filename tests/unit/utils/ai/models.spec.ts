import { expect } from 'chai'
import {
  AImodelsOptions,
  loadSystemPrompt,
  getModelProvider,
  getModelLabel,
  supportsImages,
  supportsReasoning,
} from '@/utils/ai/models'

describe('agent', () => {
  describe('loadSystemPrompt', () => {
    it('should load base prompt with language', () => {
      const result = loadSystemPrompt('en')

      // Check if it includes the base prompt
      expect(result).to.include('You are MQTTX Agent')

      // Check if it includes language setting
      expect(result).to.include('Please answer in English')
    })

    it('should include different content based on language', () => {
      const zhResult = loadSystemPrompt('zh')
      const enResult = loadSystemPrompt('en')
      const jaResult = loadSystemPrompt('ja')

      expect(zhResult).to.include('请使用中文回答')
      expect(enResult).to.include('Please answer in English')
      expect(jaResult).to.include('日本語で回答してください')
    })

    it('should include the skills list', () => {
      const result = loadSystemPrompt('en')

      expect(result).to.include('## Skills')
      expect(result).to.include('use_skill')
    })
  })

  describe('AImodelsOptions', () => {
    it('should have a non-empty label for every model', () => {
      AImodelsOptions.forEach((provider) => {
        provider.children.forEach((child) => {
          expect(child.label, `${provider.value} / ${child.value}`).to.be.a('string').that.is.not.empty
        })
      })
    })

    it('should keep model ids unique across providers', () => {
      // MQTTX derives the provider from the model id, so two providers must not share one
      const seen = new Map<string, string>()

      AImodelsOptions.forEach((provider) => {
        provider.children.forEach((child) => {
          expect(seen.has(child.value), `${child.value} is in ${seen.get(child.value)} and ${provider.value}`).to.equal(
            false,
          )
          seen.set(child.value, provider.value)
        })
      })
    })

    it('should not list the retired -thinking model ids any more', () => {
      AImodelsOptions.forEach((provider) => {
        provider.children.forEach((child) => {
          expect(child.value.endsWith('-thinking'), `${provider.value} / ${child.value}`).to.equal(false)
        })
      })
    })
  })

  describe('getModelLabel', () => {
    it('should return the display name of a known model', () => {
      expect(getModelLabel('deepseek-flash')).to.equal('DeepSeek V4.1 Flash')
    })

    it('should return the raw id for a custom model', () => {
      expect(getModelLabel('my-custom-model')).to.equal('my-custom-model')
    })
  })

  describe('supportsImages', () => {
    it('should reject the models known to be text only', () => {
      const textOnly = [
        'deepseek-v4-pro',
        'glm-5.3',
        'minimax-m2',
        'mistral-large-latest',
        'command-a-03-2025',
        'kimi-k3',
        'qwen3-max',
      ]
      for (const model of textOnly) {
        expect(supportsImages(model), model).to.equal(false)
      }
    })

    it('should accept vision models', () => {
      expect(supportsImages('deepseek-flash')).to.equal(true)
      expect(supportsImages('gpt-4o')).to.equal(true)
      expect(supportsImages('gemini-2.5-pro')).to.equal(true)
      expect(supportsImages('claude-sonnet-4-6')).to.equal(true)
      expect(supportsImages('command-a-vision-07-2025')).to.equal(true)
      expect(supportsImages('glm-4.6v')).to.equal(true)
      expect(supportsImages('qwen-3.8-27b')).to.equal(true)
      expect(supportsImages('moonshot-v1-8k-vision-preview')).to.equal(true)
    })

    it('should accept a model id the user typed', () => {
      expect(supportsImages('my-custom-vision-model')).to.equal(true)
    })
  })

  describe('supportsReasoning', () => {
    it('should reject the models that cannot control their reasoning', () => {
      const fixed = [
        'gpt-4o',
        'gpt-4.1-mini',
        'deployment-gpt-4o',
        'grok-4.20-reasoning',
        'grok-4.20-non-reasoning',
        'mistral-large-latest',
        'codestral-latest',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'command-a-03-2025',
        'command-r-plus',
        'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        'moonshot-v1-128k',
        'kimi-k2.7-code',
        'deepseek-ai/DeepSeek-V3',
        'meta/llama-4-maverick',
      ]
      for (const model of fixed) {
        expect(supportsReasoning(model), model).to.equal(false)
      }
    })

    it('should accept the models that can be asked for a strength', () => {
      const adjustable = [
        'gpt-5.2',
        'deepseek-flash',
        'claude-sonnet-4-6',
        'grok-4.7',
        'gemini-3.8-flash',
        'mistral-medium-latest',
        'openai/gpt-oss-120b',
        'command-a-reasoning-08-2025',
        'deepseek-ai/DeepSeek-V4.1-Flash',
        'accounts/fireworks/models/minimax-m3',
        'qwen-3.8-27b',
        'kimi-k3',
        'minimax-m3',
        'glm-5.3',
        'perplexity/sonar',
        'openai/gpt-5.2',
      ]
      for (const model of adjustable) {
        expect(supportsReasoning(model), model).to.equal(true)
      }
    })

    it('should accept a model id the user typed', () => {
      expect(supportsReasoning('my-custom-reasoning-model')).to.equal(true)
    })
  })

  describe('getModelProvider', () => {
    const providers: Array<[string, string, string, string]> = [
      ['gpt-4o', 'https://api.openai.com/v1', 'test-key-openai', 'OpenAI'],
      ['deepseek-flash', 'https://api.deepseek.com/v1', 'test-key-deepseek', 'DeepSeek'],
      ['claude-sonnet-4-6', 'https://api.anthropic.com/v1', 'test-key-anthropic', 'Anthropic'],
      ['grok-4.7', 'https://api.x.ai/v1', 'test-key-xai', 'xAI'],
      ['gemini-2.5-pro', 'https://generativelanguage.googleapis.com/v1beta', 'test-key-google', 'Google'],
      ['deepseek-ai/DeepSeek-V3', 'https://api.siliconflow.cn/v1', 'test-key-siliconflow', 'SiliconFlow'],
      ['qwen3-max', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', 'test-key-alibaba', 'Alibaba'],
      ['mistral-large-latest', 'https://api.mistral.ai/v1', 'test-key-mistral', 'Mistral'],
      ['llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1', 'test-key-groq', 'Groq'],
      ['command-a-03-2025', 'https://api.cohere.com/v2', 'test-key-cohere', 'Cohere'],
      ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'https://api.together.xyz/v1', 'test-key-together', 'Together AI'],
      ['accounts/fireworks/models/glm-5p3', 'https://api.fireworks.ai/inference/v1', 'test-key-fireworks', 'Fireworks'],
      ['deepseek-ai/DeepSeek-V3', 'https://api.deepinfra.com/v1', 'test-key-deepinfra', 'DeepInfra'],
      ['gpt-oss-120b', 'https://api.cerebras.ai/v1', 'test-key-cerebras', 'Cerebras'],
      ['kimi-k3', 'https://api.moonshot.ai/v1', 'test-key-moonshot', 'Moonshot AI'],
      ['minimax-m3', 'https://api.minimax.io/anthropic/v1', 'test-key-minimax', 'MiniMax'],
      ['glm-5.3', 'https://api.z.ai/api/paas/v4', 'test-key-zai', 'Z.AI'],
      ['perplexity/sonar', 'https://api.perplexity.ai', 'test-key-perplexity', 'Perplexity'],
      ['openai/gpt-5.2', 'https://ai-gateway.vercel.sh/v4/ai', 'test-key-gateway', 'Vercel AI Gateway'],
    ]

    for (const [model, baseURL, apiKey, providerType] of providers) {
      it(`should return a provider instance for ${providerType}`, () => {
        expect(() => getModelProvider({ model, baseURL, apiKey, providerType } as any)).not.to.throw()
      })
    }

    it('should create a model for every provider in AImodelsOptions', () => {
      AImodelsOptions.forEach((provider) => {
        expect(
          () =>
            getModelProvider({
              model: provider.children[0].value,
              baseURL: '',
              apiKey: 'test-key',
              providerType: provider.value,
            } as any),
          provider.value,
        ).not.to.throw()
      })
    })

    it('should return a provider instance for Azure OpenAI using baseURL with api-version', () => {
      expect(() => {
        getModelProvider({
          model: 'deployment-gpt-4o',
          baseURL: 'https://my-azure-resource.openai.azure.com/?api-version=2025-01-01-preview',
          apiKey: 'test-key-azure',
          providerType: 'Azure OpenAI',
        })
      }).not.to.throw()
    })

    it('should return a provider instance for Azure OpenAI using resource name with api-version', () => {
      expect(() => {
        getModelProvider({
          model: 'deployment-gpt-4o',
          baseURL: 'my-azure-resource?api-version=2025-01-01-preview',
          apiKey: 'test-key-azure',
          providerType: 'Azure OpenAI',
        })
      }).not.to.throw()
    })

    it('should fallback to OpenAI if provider is misconfigured', () => {
      expect(() => {
        getModelProvider({
          model: 'deployment-gpt-4o',
          baseURL: '',
          apiKey: 'test-key-azure',
          providerType: 'Azure OpenAI',
        })
      }).not.to.throw()
    })

    describe('request URL', () => {
      const originalFetch = globalThis.fetch

      afterEach(() => {
        globalThis.fetch = originalFetch
      })

      const getRequestURL = async (opts: Parameters<typeof getModelProvider>[0]) => {
        let requestURL = ''
        globalThis.fetch = (async (input: RequestInfo | URL) => {
          requestURL = input.toString()
          throw new Error('stop')
        }) as typeof fetch
        try {
          await getModelProvider(opts).doGenerate({
            prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
          })
        } catch {}
        return requestURL
      }

      it('should use Chat Completions for OpenAI-compatible hosts', async () => {
        const url = await getRequestURL({
          model: 'deepseek-ai/DeepSeek-V3',
          baseURL: 'https://api.siliconflow.cn/v1',
          apiKey: 'test-key-siliconflow',
          providerType: 'SiliconFlow',
        })
        expect(url).to.equal('https://api.siliconflow.cn/v1/chat/completions')
      })

      it('should use deployment-based Azure URLs for an endpoint baseURL', async () => {
        const url = await getRequestURL({
          model: 'deployment-gpt-4o',
          baseURL: 'https://my-azure-resource.openai.azure.com/?api-version=2025-01-01-preview',
          apiKey: 'test-key-azure',
          providerType: 'Azure OpenAI',
        })
        expect(url).to.equal(
          'https://my-azure-resource.openai.azure.com/openai/deployments/deployment-gpt-4o/chat/completions?api-version=2025-01-01-preview',
        )
      })

      it('should use deployment-based Azure URLs for a resource name', async () => {
        const url = await getRequestURL({
          model: 'deployment-gpt-4o',
          baseURL: 'my-azure-resource?api-version=2025-01-01-preview',
          apiKey: 'test-key-azure',
          providerType: 'Azure OpenAI',
        })
        expect(url).to.equal(
          'https://my-azure-resource.openai.azure.com/openai/deployments/deployment-gpt-4o/chat/completions?api-version=2025-01-01-preview',
        )
      })
    })
  })
})
