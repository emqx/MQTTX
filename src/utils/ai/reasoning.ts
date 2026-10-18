/**
 * Reasoning strength ("effort") for the Agent.
 *
 * MQTTX stores one level per app and passes it to the AI SDK's unified `reasoning` call option, which
 * every provider package maps to its own field: `reasoning_effort` for OpenAI-compatible providers, a
 * thinking budget for Anthropic/Google/Alibaba/Cohere, and so on. Models that cannot control their
 * reasoning are marked `reasoning: false` in `AImodelsOptions` and the setting is not sent to them.
 */
import type { SharedV4ProviderOptions } from '@ai-sdk/provider'

export const AGENT_REASONING_LEVELS = ['provider-default', 'none', 'low', 'medium', 'high', 'max'] as const

export type AgentReasoning = typeof AGENT_REASONING_LEVELS[number]

/** Let the provider use its own default; nothing is added to the request */
export const DEFAULT_AGENT_REASONING: AgentReasoning = 'provider-default'

/** Legacy model ids that turned thinking on with a suffix; the reasoning setting replaced them */
export const THINKING_MODEL_SUFFIX = '-thinking'

/** Level used when a legacy `-thinking` model is migrated and the user never picked a level */
export const MIGRATED_AGENT_REASONING: AgentReasoning = 'high'

export const isAgentReasoning = (value: unknown): value is AgentReasoning =>
  typeof value === 'string' && (AGENT_REASONING_LEVELS as readonly string[]).includes(value)

/** Anything stored that is not one of the levels falls back to the provider default */
export const normalizeAgentReasoning = (value?: unknown): AgentReasoning =>
  isAgentReasoning(value) ? value : DEFAULT_AGENT_REASONING

/** i18n key of the label shown for a level */
export const reasoningLabelKey = (level: AgentReasoning): string =>
  `agent.reasoning.${level === 'provider-default' ? 'auto' : level === 'none' ? 'off' : level}`

export interface LegacyThinkingMigration {
  /** Model id to keep, with the retired `-thinking` suffix removed */
  model: string
  /** Level to store, only when the user had never chosen one */
  agentReasoning?: AgentReasoning
  /** Whether anything has to be written back */
  migrated: boolean
}

/**
 * One-off fix-up of model ids saved before reasoning became a setting: `xxx-thinking` becomes `xxx`,
 * keeping thinking on (High) unless the user already picked a level. Returns `migrated: false` for
 * every other model, so the caller writes nothing.
 */
export const migrateLegacyThinkingModel = (
  model?: string | null,
  storedReasoning?: unknown,
): LegacyThinkingMigration => {
  const storedModel = typeof model === 'string' ? model : ''
  if (!storedModel.endsWith(THINKING_MODEL_SUFFIX)) return { model: storedModel, migrated: false }

  const hasChosenReasoning = storedReasoning !== undefined && storedReasoning !== null && storedReasoning !== ''
  return {
    model: storedModel.slice(0, -THINKING_MODEL_SUFFIX.length),
    ...(hasChosenReasoning ? {} : { agentReasoning: MIGRATED_AGENT_REASONING }),
    migrated: true,
  }
}

/** Call options derived from the setting, merged into the ToolLoopAgent settings */
export interface AgentReasoningCallOptions {
  reasoning?: AgentReasoning
  providerOptions?: SharedV4ProviderOptions
}

/**
 * The `reasoning` level to send for one model, plus the one provider option the level cannot express:
 * Google only returns its thought summaries when asked to, so without `includeThoughts` the reasoning
 * block stays empty.
 */
export const buildReasoningCallOptions = (opts: {
  reasoning: AgentReasoning
  /** Provider `value` from `AImodelsOptions` */
  provider: string
  /** Whether the model can be asked for a strength at all (see `supportsReasoning`) */
  modelSupportsReasoning: boolean
}): AgentReasoningCallOptions => {
  const { reasoning, provider, modelSupportsReasoning } = opts
  const level = normalizeAgentReasoning(reasoning)
  if (!modelSupportsReasoning || level === DEFAULT_AGENT_REASONING) return {}

  return {
    reasoning: level,
    ...(provider === 'Google' ? { providerOptions: { google: { thinkingConfig: { includeThoughts: true } } } } : {}),
  }
}
