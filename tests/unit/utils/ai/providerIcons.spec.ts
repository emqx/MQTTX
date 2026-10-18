import { expect } from 'chai'
import { AImodelsOptions } from '@/utils/ai/models'
import { PROVIDER_ICONS, modelIconBrand, providerIconBrand, resolveProviderIcon } from '@/utils/ai/providerIcons'

describe('agent', () => {
  describe('provider icons', () => {
    describe('coverage of AImodelsOptions', () => {
      AImodelsOptions.forEach((provider) => {
        it(`should have an icon for ${provider.value}`, () => {
          const asset = resolveProviderIcon(provider.value)

          expect(asset, provider.value).to.not.equal(undefined)
          expect(asset?.src, provider.value).to.be.a('string').that.is.not.empty
        })

        it(`should have an icon for every ${provider.value} model`, () => {
          provider.children.forEach((child) => {
            const asset = resolveProviderIcon(provider.value, child.value)

            expect(asset, `${provider.value} / ${child.value}`).to.not.equal(undefined)
            expect(asset?.src, `${provider.value} / ${child.value}`).to.be.a('string').that.is.not.empty
          })
        })
      })
    })

    it('should give every brand one icon file', () => {
      Object.entries(PROVIDER_ICONS).forEach(([brand, asset]) => {
        expect(asset.src, brand).to.be.a('string').that.is.not.empty
      })
    })

    it('should map every provider to a brand that has an icon', () => {
      AImodelsOptions.forEach((provider) => {
        const brand = providerIconBrand(provider.value)

        expect(brand, provider.value).to.be.a('string')
        expect(PROVIDER_ICONS[brand as string], provider.value).to.not.equal(undefined)
      })
    })

    it('should keep every model series brand backed by an icon', () => {
      AImodelsOptions.forEach((provider) => {
        provider.children.forEach((child) => {
          const brand = modelIconBrand(child.value)
          if (brand) expect(PROVIDER_ICONS[brand], `${provider.value} / ${child.value}`).to.not.equal(undefined)
        })
      })
    })

    describe('brand selection', () => {
      it('should prefer the model series icon over the provider icon', () => {
        expect(resolveProviderIcon('Google', 'gemini-2.5-pro')).to.equal(PROVIDER_ICONS.gemini)
        expect(resolveProviderIcon('xAI', 'grok-4.7')).to.equal(PROVIDER_ICONS.grok)
        expect(resolveProviderIcon('Anthropic', 'claude-sonnet-4-6')).to.equal(PROVIDER_ICONS.claude)
        expect(resolveProviderIcon('Moonshot AI', 'kimi-k3')).to.equal(PROVIDER_ICONS.kimi)
        expect(resolveProviderIcon('Alibaba', 'qwen3-max')).to.equal(PROVIDER_ICONS.qwen)
        expect(resolveProviderIcon('Z.AI', 'glm-5.3')).to.equal(PROVIDER_ICONS.zhipu)
        expect(resolveProviderIcon('Vercel AI Gateway', 'openai/gpt-5.2')).to.equal(PROVIDER_ICONS.openai)
      })

      it('should fall back to the provider icon for other models', () => {
        expect(resolveProviderIcon('Cohere', 'command-a-03-2025')).to.equal(PROVIDER_ICONS.cohere)
        expect(resolveProviderIcon('Perplexity', 'fast')).to.equal(PROVIDER_ICONS.perplexity)
        expect(resolveProviderIcon('OpenAI', 'gpt-4o')).to.equal(PROVIDER_ICONS.openai)
      })

      it('should return nothing for an unknown provider', () => {
        expect(resolveProviderIcon('Unknown')).to.equal(undefined)
        expect(providerIconBrand('Unknown')).to.equal(undefined)
      })
    })
  })
})
