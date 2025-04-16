import { expect } from 'chai'
import { createAzure } from '@ai-sdk/azure'
import { AImodelsOptions, AIAPIHostOptions, loadSystemPrompt, getModelProvider } from '@/utils/ai/copilot'
import { createOpenAI } from '@ai-sdk/openai'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

describe('copilot', () => {
  describe('loadSystemPrompt', () => {
    it('should load base prompt with language', () => {
      const result = loadSystemPrompt('en')

      // Check if it includes the base prompt
      expect(result).to.include('You are MQTTX Copilot')

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

    it('should handle undefined command parameter', () => {
      const result = loadSystemPrompt('en', undefined)

      // Result should include base prompt but not command-specific prompts
      expect(result).to.include('You are MQTTX Copilot')
      expect(result).to.include('Please answer in English')
    })

    it('should handle different command inputs', () => {
      // Here we only test that the function handles different commands without throwing errors
      expect(() => loadSystemPrompt('en', 'some-code-command')).to.not.throw()
      expect(() => loadSystemPrompt('en', 'some-payload-command')).to.not.throw()
      expect(() => loadSystemPrompt('en', 'some-emqx-command')).to.not.throw()
      expect(() => loadSystemPrompt('en', 'some-mqtt-faq-command')).to.not.throw()
      expect(() => loadSystemPrompt('en', 'some-function-command')).to.not.throw()
      expect(() => loadSystemPrompt('en', 'some-schema-command')).to.not.throw()
    })
  })

  describe('AImodelsOptions', () => {
    it('should contain all supported providers', () => {
      const providerNames = AImodelsOptions.map((provider) => provider.value)
      expect(providerNames).to.have.members([
        'OpenAI',
        'DeepSeek',
        'Anthropic',
        'xAI',
        'Google',
        'Azure OpenAI',
        'SiliconFlow',
      ])
    })

    it('should have valid model options for each provider', () => {
      const openAI = AImodelsOptions.find((p) => p.value === 'OpenAI')
      expect(openAI?.children).to.be.an('array').that.is.not.empty
      expect(openAI?.children.map((c) => c.value)).to.include('gpt-4o')

      const deepSeek = AImodelsOptions.find((p) => p.value === 'DeepSeek')
      expect(deepSeek?.children).to.be.an('array').that.is.not.empty
      expect(deepSeek?.children.map((c) => c.value)).to.include('deepseek-chat')

      const anthropic = AImodelsOptions.find((p) => p.value === 'Anthropic')
      expect(anthropic?.children).to.be.an('array').that.is.not.empty
      expect(anthropic?.children.map((c) => c.value)).to.include('claude-3-opus-latest')

      const xai = AImodelsOptions.find((p) => p.value === 'xAI')
      expect(xai?.children).to.be.an('array').that.is.not.empty
      expect(xai?.children.map((c) => c.value)).to.include('grok-3-beta')

      const google = AImodelsOptions.find((p) => p.value === 'Google')
      expect(google?.children).to.be.an('array').that.is.not.empty
      expect(google?.children.map((c) => c.value)).to.include('gemini-1.5-pro')

      const azure = AImodelsOptions.find((p) => p.value === 'Azure OpenAI')
      expect(azure?.children).to.be.an('array').that.is.not.empty
      expect(azure?.children.map((c) => c.value)).to.include('deployment-gpt-4o')

      const siliconFlow = AImodelsOptions.find((p) => p.value === 'SiliconFlow')
      expect(siliconFlow?.children).to.be.an('array').that.is.not.empty
      expect(siliconFlow?.children.map((c) => c.value)).to.include('deepseek-ai/DeepSeek-V3')
    })

    it('should have the correct provider creator function for each provider', () => {
      const expectedCreators: Record<string, Function> = {
        OpenAI: createOpenAI,
        DeepSeek: createDeepSeek,
        Anthropic: createAnthropic,
        xAI: createXai,
        Google: createGoogleGenerativeAI,
        'Azure OpenAI': createAzure,
        SiliconFlow: createOpenAI,
      }

      AImodelsOptions.forEach((provider) => {
        expect(provider.providerCreator, `Creator for ${provider.value}`).to.be.a('function')
        expect(provider.providerCreator, `Creator mismatch for ${provider.value}`).to.equal(
          expectedCreators[provider.value],
        )
      })
    })
  })

  describe('AIAPIHostOptions', () => {
    it('should include the default Google API host', () => {
      const googleHost = AIAPIHostOptions.find((opt) => opt.value.includes('google'))?.value
      expect(googleHost).to.equal('https://generativelanguage.googleapis.com/v1beta')
    })

    it('should include the Azure API host placeholder/example', () => {
      const azureHostExample = AIAPIHostOptions.find((opt) => opt.value.includes('azure'))?.value
      expect(azureHostExample).to.equal('https://${resourceName}.openai.azure.com')
    })
  })

  describe('getModelProvider', () => {
    it('should return a provider instance for OpenAI', () => {
      expect(() => {
        getModelProvider({
          model: 'gpt-4o',
          baseURL: 'https://api.openai.com/v1',
          apiKey: 'test-key-openai',
          providerType: 'OpenAI',
        })
      }).not.to.throw()
    })

    it('should return a provider instance for DeepSeek', () => {
      expect(() => {
        getModelProvider({
          model: 'deepseek-chat',
          baseURL: 'https://api.deepseek.com/v1',
          apiKey: 'test-key-deepseek',
          providerType: 'DeepSeek',
        })
      }).not.to.throw()
    })

    it('should return a provider instance for Anthropic', () => {
      expect(() => {
        getModelProvider({
          model: 'claude-3-opus-latest',
          baseURL: 'https://api.anthropic.com/v1',
          apiKey: 'test-key-anthropic',
          providerType: 'Anthropic',
        })
      }).not.to.throw()
    })

    it('should return a provider instance for xAI', () => {
      expect(() => {
        getModelProvider({
          model: 'grok-3-beta',
          baseURL: 'https://api.x.ai/v1',
          apiKey: 'test-key-xai',
          providerType: 'xAI',
        })
      }).not.to.throw()
    })

    it('should return a provider instance for Google', () => {
      expect(() => {
        getModelProvider({
          model: 'gemini-2.0-flash',
          baseURL: 'https://generativelanguage.googleapis.com/v1beta',
          apiKey: 'test-key-google',
          providerType: 'Google',
        })
      }).not.to.throw()
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

    it('should return a provider instance for SiliconFlow', () => {
      expect(() => {
        getModelProvider({
          model: 'deepseek-ai/DeepSeek-V3',
          baseURL: 'https://api.siliconflow.cn/v1',
          apiKey: 'test-key-siliconflow',
          providerType: 'SiliconFlow',
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
  })
})
