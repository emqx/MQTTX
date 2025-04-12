import { expect } from 'chai'
import { AImodelsOptions, AIAPIHostOptions, loadSystemPrompt, getModelProvider } from '@/utils/ai/copilot'

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

      expect(providerNames).to.include('OpenAI')
      expect(providerNames).to.include('DeepSeek')
      expect(providerNames).to.include('Anthropic')
      expect(providerNames).to.include('xAI')
      expect(providerNames).to.include('SiliconFlow')
    })

    it('should have valid model options for each provider', () => {
      // Check OpenAI provider
      const openAI = AImodelsOptions.find((p) => p.value === 'OpenAI')
      expect(openAI).to.exist
      expect(openAI?.children).to.be.an('array').that.is.not.empty
      expect(openAI?.children.map((c) => c.value)).to.include('gpt-4o')

      // Check DeepSeek provider
      const deepSeek = AImodelsOptions.find((p) => p.value === 'DeepSeek')
      expect(deepSeek).to.exist
      expect(deepSeek?.children).to.be.an('array').that.is.not.empty
      expect(deepSeek?.children.map((c) => c.value)).to.include('deepseek-chat')

      // Check Anthropic provider
      const anthropic = AImodelsOptions.find((p) => p.value === 'Anthropic')
      expect(anthropic).to.exist
      expect(anthropic?.children).to.be.an('array').that.is.not.empty
      expect(anthropic?.children.map((c) => c.value)).to.include('claude-3-opus-latest')
    })

    it('should have provider creator functions', () => {
      // Verify each provider has a creator function
      AImodelsOptions.forEach((provider) => {
        expect(provider.providerCreator).to.be.a('function')
      })
    })

    it('should contain Google provider', () => {
      const providerNames = AImodelsOptions.map((provider) => provider.value)
      expect(providerNames).to.include('Google')
    })

    it('should have valid model options for Google', () => {
      const google = AImodelsOptions.find((p) => p.value === 'Google')
      expect(google).to.exist
      expect(google?.children).to.be.an('array').that.is.not.empty
      expect(google?.children.map((c) => c.value)).to.include('gemini-1.5-pro-latest')
    })

    it('should have provider creator function for Google', () => {
      const google = AImodelsOptions.find((p) => p.value === 'Google')
      expect(google?.providerCreator).to.be.a('function')
    })
  })

  describe('AIAPIHostOptions', () => {
    it('should include the default Google API host', () => {
      const googleHost = AIAPIHostOptions.find((opt) => opt.value.includes('google'))?.value
      expect(googleHost).to.equal('https://generativelanguage.googleapis.com/v1beta')
    })
  })

  describe('getModelProvider', () => {
    it('should return a provider instance for OpenAI', () => {
      expect(() => {
        getModelProvider({
          model: 'gpt-4o',
          baseURL: 'https://api.openai.com/v1',
          apiKey: 'test-key',
          providerType: 'OpenAI',
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

    // Add similar tests for other providers (DeepSeek, Anthropic, xAI, SiliconFlow) if desired

    it('should accept baseURL for applicable providers', () => {
      expect(() => {
        getModelProvider({
          model: 'deepseek-chat',
          baseURL: 'https://custom.deepseek.com/v1',
          apiKey: 'test-key-deepseek',
          providerType: 'DeepSeek',
        })
      }).not.to.throw()
    })
  })
})
