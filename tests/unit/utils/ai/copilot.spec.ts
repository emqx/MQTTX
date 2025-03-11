import { expect } from 'chai'
import { loadSystemPrompt, getModelProvider, AImodelsOptions } from '@/utils/ai/copilot'

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
  })

  describe('getModelProvider', () => {
    it('should accept valid parameters', () => {
      // This test only verifies the function accepts parameters without throwing errors
      expect(() => {
        getModelProvider({
          model: 'gpt-4o',
          baseURL: 'https://api.openai.com/v1',
          apiKey: 'test-key',
        })
      }).to.not.throw()
    })

    it('should work with different model types', () => {
      // Verify the function can handle different model types
      const validModels = [
        'gpt-4o', // OpenAI
        'deepseek-chat', // DeepSeek
        'claude-3-opus-latest', // Anthropic
        'grok-2-1212', // xAI
      ]

      validModels.forEach((model) => {
        expect(() => {
          getModelProvider({
            model: model as any,
            baseURL: 'https://api.example.com/v1',
            apiKey: 'test-key',
          })
        }).to.not.throw()
      })
    })
  })
})
