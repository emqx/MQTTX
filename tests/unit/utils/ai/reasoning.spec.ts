import { expect } from 'chai'
import {
  AGENT_REASONING_LEVELS,
  buildReasoningCallOptions,
  isAgentReasoning,
  migrateLegacyThinkingModel,
  normalizeAgentReasoning,
  reasoningLabelKey,
} from '@/utils/ai/reasoning'

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

      it('should ignore a level that is not offered', () => {
        expect(
          buildReasoningCallOptions({ reasoning: 'xhigh' as any, provider: 'OpenAI', modelSupportsReasoning: true }),
        ).to.deep.equal({})
      })
    })
  })
})
