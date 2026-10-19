/**
 * Reasoning strength ("effort") for the Agent.
 *
 * MQTTX stores one level per app and passes it to the AI SDK's unified `reasoning` call option, which
 * every provider package maps to its own field: `reasoning_effort` for OpenAI-compatible providers, a
 * thinking budget for Anthropic/Google/Alibaba/Cohere, and so on. Models that cannot control their
 * reasoning are marked `reasoning: false` in `AImodelsOptions` and the setting is not sent to them. Models
 * whose API only honours some values list them in `reasoningEfforts`; for those the stored level is
 * replaced by the closest one they offer, so an unsupported value never reaches the API.
 */
import type { SharedV4ProviderOptions } from '@ai-sdk/provider'
import type { ReasoningEffort } from '@/types/agent'

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

/** The SDK's reasoning values from least to most thinking */
const EFFORT_ORDER: readonly ReasoningEffort[] = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

const rank = (value: AgentReasoning | ReasoningEffort): number => (EFFORT_ORDER as readonly string[]).indexOf(value)

/** Models that can only turn thinking on or off; their High is shown as On */
const isOnOff = (efforts?: readonly ReasoningEffort[]): boolean =>
  !!efforts && efforts.every((effort) => effort === 'none' || effort === 'high')

/** Whether a model honours a level; Max stands for its strongest value above High */
const offers = (level: AgentReasoning, efforts?: readonly ReasoningEffort[]): boolean =>
  level === DEFAULT_AGENT_REASONING ||
  !efforts ||
  (level === 'max' ? efforts.some((effort) => rank(effort) > rank('high')) : efforts.includes(level))

/** The levels offered for a model with these `reasoningEfforts` (all of them when it has none) */
export const reasoningLevelsFor = (efforts?: readonly ReasoningEffort[]): AgentReasoning[] =>
  AGENT_REASONING_LEVELS.filter((level) => offers(level, efforts))

/**
 * The level that applies to a model: the chosen one when the model offers it, otherwise the closest
 * offered level. Only Off turns reasoning off, and ties go to the stronger level.
 */
export const effectiveReasoning = (level: AgentReasoning, efforts?: readonly ReasoningEffort[]): AgentReasoning => {
  if (offers(level, efforts)) return level
  const distance = (candidate: AgentReasoning) => Math.abs(rank(candidate) - rank(level))
  return reasoningLevelsFor(efforts)
    .filter((candidate) => candidate !== DEFAULT_AGENT_REASONING && (level === 'none' || candidate !== 'none'))
    .reduce((best, candidate) => (distance(candidate) <= distance(best) ? candidate : best))
}

/** i18n key of the label shown for a level */
export const reasoningLabelKey = (level: AgentReasoning, efforts?: readonly ReasoningEffort[]): string => {
  if (level === 'high' && isOnOff(efforts)) return 'agent.reasoning.on'
  return `agent.reasoning.${level === 'provider-default' ? 'auto' : level === 'none' ? 'off' : level}`
}

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
  reasoning?: ReasoningEffort
  providerOptions?: SharedV4ProviderOptions
}

/**
 * The `reasoning` value to send for one model, plus what the value cannot express: Google only returns
 * its thought summaries when asked to (without `includeThoughts` the reasoning block stays empty), and
 * Z.AI turns thinking on or off with its own `thinking` field.
 */
export const buildReasoningCallOptions = (opts: {
  reasoning: AgentReasoning
  /** Provider `value` from `AImodelsOptions` */
  provider: string
  /** Whether the model can be asked for a strength at all (see `supportsReasoning`) */
  modelSupportsReasoning: boolean
  /** The values the model honours, from least to most thinking (see `getReasoningEfforts`) */
  efforts?: readonly ReasoningEffort[]
}): AgentReasoningCallOptions => {
  const { reasoning, provider, modelSupportsReasoning, efforts } = opts
  const level = effectiveReasoning(normalizeAgentReasoning(reasoning), efforts)
  if (!modelSupportsReasoning || level === DEFAULT_AGENT_REASONING) return {}

  const effort: ReasoningEffort = level === 'max' && efforts ? efforts[efforts.length - 1] : level
  if (provider === 'Google') {
    return { reasoning: effort, providerOptions: { google: { thinkingConfig: { includeThoughts: true } } } }
  }
  if (provider === 'Z.AI') {
    // GLM models before 5.2 ignore `reasoning_effort` and only read `thinking`
    return {
      ...(isOnOff(efforts) ? {} : { reasoning: effort }),
      providerOptions: { zai: { thinking: { type: effort === 'none' ? 'disabled' : 'enabled' } } },
    }
  }
  return { reasoning: effort }
}
