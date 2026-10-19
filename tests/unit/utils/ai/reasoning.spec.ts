import { expect } from 'chai'
import {
  AGENT_REASONING_LEVELS,
  buildReasoningCallOptions,
  effectiveReasoning,
  isAgentReasoning,
  migrateLegacyThinkingModel,
  normalizeAgentReasoning,
  reasoningLabelKey,
  reasoningLevelsFor,
} from '@/utils/ai/reasoning'
import { AImodelsOptions, getReasoningEfforts } from '@/utils/ai/models'

describe('agent', () => {
  describe('agent reasoning', () => {
    describe('normalizeAgentReasoning', () => {
      it('should keep every offered level', () => {
        for (const level of AGENT_REASONING_LEVELS) {
          expect(normalizeAgentReasoning(level), level).to.equal(level)
        }
      })

      it('should fall back to the provider default for anything else', () => {
        for (const value of [undefined, null, '', 'xhigh', 'minimal', 'HIGH', 42, {}]) {
          expect(normalizeAgentReasoning(value), String(value)).to.equal('provider-default')
        }
      })

      it('should only accept the offered levels', () => {
        expect(isAgentReasoning('high')).to.equal(true)
        expect(isAgentReasoning('minimal')).to.equal(false)
        expect(isAgentReasoning(undefined)).to.equal(false)
      })
    })

    describe('reasoningLabelKey', () => {
      it('should map each level to its i18n key', () => {
        expect(reasoningLabelKey('provider-default')).to.equal('agent.reasoning.auto')
        expect(reasoningLabelKey('none')).to.equal('agent.reasoning.off')
        expect(reasoningLabelKey('medium')).to.equal('agent.reasoning.medium')
        expect(reasoningLabelKey('max')).to.equal('agent.reasoning.max')
      })

      it('should call High "On" for a model that can only turn thinking on or off', () => {
        expect(reasoningLabelKey('high', getReasoningEfforts('kimi-k2.6'))).to.equal('agent.reasoning.on')
        expect(reasoningLabelKey('high', getReasoningEfforts('gpt-5.2'))).to.equal('agent.reasoning.high')
      })
    })

    describe('reasoningLevelsFor', () => {
      it('should offer every level for a model whose provider maps them all', () => {
        expect(reasoningLevelsFor(getReasoningEfforts('claude-sonnet-4-6'))).to.deep.equal([...AGENT_REASONING_LEVELS])
      })

      it('should only offer the levels a model honours', () => {
        expect(reasoningLevelsFor(getReasoningEfforts('gpt-5'))).to.deep.equal([
          'provider-default',
          'low',
          'medium',
          'high',
        ])
        expect(reasoningLevelsFor(getReasoningEfforts('gpt-5.2'))).to.deep.equal([...AGENT_REASONING_LEVELS])
        expect(reasoningLevelsFor(getReasoningEfforts('glm-4.6'))).to.deep.equal(['provider-default', 'none', 'high'])
      })
    })

    describe('effectiveReasoning', () => {
      it('should keep a level the model offers', () => {
        expect(effectiveReasoning('none', getReasoningEfforts('gpt-5.1'))).to.equal('none')
        expect(effectiveReasoning('provider-default', getReasoningEfforts('gpt-5'))).to.equal('provider-default')
      })

      it('should fall back to the closest offered level, never turning reasoning off', () => {
        expect(effectiveReasoning('none', getReasoningEfforts('gpt-5'))).to.equal('low')
        expect(effectiveReasoning('max', getReasoningEfforts('gpt-5.1'))).to.equal('high')
        expect(effectiveReasoning('medium', getReasoningEfforts('kimi-k3'))).to.equal('high')
        expect(effectiveReasoning('low', getReasoningEfforts('glm-4.6'))).to.equal('high')
      })
    })

    describe('migrateLegacyThinkingModel', () => {
      it('should drop the retired suffix and turn thinking on when no level was ever chosen', () => {
        expect(migrateLegacyThinkingModel('claude-sonnet-4-5-20250929-thinking', undefined)).to.deep.equal({
          model: 'claude-sonnet-4-5-20250929',
          agentReasoning: 'high',
          migrated: true,
        })
        expect(migrateLegacyThinkingModel('gemini-2.5-pro-thinking', null)).to.deep.equal({
          model: 'gemini-2.5-pro',
          agentReasoning: 'high',
          migrated: true,
        })
      })

      it('should keep a level the user already chose', () => {
        for (const stored of ['low', 'provider-default', 'max']) {
          expect(migrateLegacyThinkingModel('gemini-3.8-flash-thinking', stored), stored).to.deep.equal({
            model: 'gemini-3.8-flash',
            migrated: true,
          })
        }
      })

      it('should leave every other model alone', () => {
        for (const model of ['gpt-5.2', 'deepseek-flash', '', undefined, null]) {
          expect(migrateLegacyThinkingModel(model, undefined), String(model)).to.deep.equal({
            model: model ?? '',
            migrated: false,
          })
        }
      })
    })

    describe('buildReasoningCallOptions', () => {
      it('should send the chosen level for a model that supports it', () => {
        expect(
          buildReasoningCallOptions({ reasoning: 'high', provider: 'Anthropic', modelSupportsReasoning: true }),
        ).to.deep.equal({ reasoning: 'high' })
      })

      it('should ask Google for its thought summaries as well', () => {
        expect(
          buildReasoningCallOptions({ reasoning: 'medium', provider: 'Google', modelSupportsReasoning: true }),
        ).to.deep.equal({
          reasoning: 'medium',
          providerOptions: { google: { thinkingConfig: { includeThoughts: true } } },
        })
      })

      it('should send nothing for the provider default, whatever the provider', () => {
        for (const provider of ['Google', 'OpenAI', 'Anthropic']) {
          expect(
            buildReasoningCallOptions({ reasoning: 'provider-default', provider, modelSupportsReasoning: true }),
            provider,
          ).to.deep.equal({})
        }
      })

      it('should send nothing to a model that cannot control its reasoning', () => {
        expect(
          buildReasoningCallOptions({ reasoning: 'high', provider: 'Google', modelSupportsReasoning: false }),
        ).to.deep.equal({})
      })

      it('should only send values a listed model accepts', () => {
        for (const provider of AImodelsOptions) {
          for (const model of provider.children) {
            if (!model.reasoningEfforts) continue
            for (const reasoning of AGENT_REASONING_LEVELS) {
              const options = buildReasoningCallOptions({
                reasoning,
                provider: provider.value,
                modelSupportsReasoning: true,
                efforts: model.reasoningEfforts,
              })
              if (options.reasoning)
                expect(model.reasoningEfforts, `${model.value} ${reasoning}`).to.include(options.reasoning)
            }
          }
        }
      })

      it('should send the strongest value a model has for Max', () => {
        const efforts = getReasoningEfforts('gpt-5.2')
        expect(
          buildReasoningCallOptions({ reasoning: 'max', provider: 'OpenAI', modelSupportsReasoning: true, efforts }),
        ).to.deep.equal({ reasoning: 'xhigh' })
      })

      it('should turn Z.AI thinking on or off with its own field', () => {
        const options = (reasoning: 'none' | 'high', model: string) =>
          buildReasoningCallOptions({
            reasoning,
            provider: 'Z.AI',
            modelSupportsReasoning: true,
            efforts: getReasoningEfforts(model),
          })

        expect(options('none', 'glm-4.6')).to.deep.equal({
          providerOptions: { zai: { thinking: { type: 'disabled' } } },
        })
        expect(options('high', 'glm-5.3')).to.deep.equal({
          reasoning: 'high',
          providerOptions: { zai: { thinking: { type: 'enabled' } } },
        })
      })

      it('should ignore a level that is not offered', () => {
        expect(
          buildReasoningCallOptions({ reasoning: 'xhigh' as any, provider: 'OpenAI', modelSupportsReasoning: true }),
        ).to.deep.equal({})
      })
    })
  })
})
