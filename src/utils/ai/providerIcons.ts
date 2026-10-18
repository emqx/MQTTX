/**
 * Brand icons for AI providers and model series.
 *
 * The SVGs live in `src/assets/images/ai-providers` (source and license are documented in that
 * folder's README). A brand uses its colour icon when it has one, otherwise its monochrome icon drawn
 * with `fill="currentColor"`.
 *
 * Monochrome icons do not follow the text colour when they are used inside an `<img>`, so
 * `AiProviderIcon.vue` paints them through a CSS mask with `background-color: currentColor`. That
 * keeps black logos visible in the light, dark and night themes. Colour icons are plain images.
 */
export interface ProviderIconAsset {
  src: string
  /** Drawn with `currentColor` through a CSS mask instead of shown as an image */
  mono?: boolean
}

/** Icon brand -> its colour icon, or its monochrome icon when the brand only publishes one */
export const PROVIDER_ICONS: Record<string, ProviderIconAsset> = {
  alibaba: { src: require('@/assets/images/ai-providers/alibaba-color.svg') },
  anthropic: { src: require('@/assets/images/ai-providers/anthropic.svg'), mono: true },
  azure: { src: require('@/assets/images/ai-providers/azure-color.svg') },
  // `cerebras-color` mixes currentColor (black in an <img>) with its brand colour, so it is unusable
  // in the dark themes; the monochrome icon follows the text colour everywhere.
  cerebras: { src: require('@/assets/images/ai-providers/cerebras.svg'), mono: true },
  claude: { src: require('@/assets/images/ai-providers/claude-color.svg') },
  cohere: { src: require('@/assets/images/ai-providers/cohere-color.svg') },
  deepinfra: { src: require('@/assets/images/ai-providers/deepinfra-color.svg') },
  deepseek: { src: require('@/assets/images/ai-providers/deepseek-color.svg') },
  fireworks: { src: require('@/assets/images/ai-providers/fireworks-color.svg') },
  gemini: { src: require('@/assets/images/ai-providers/gemini-color.svg') },
  gemma: { src: require('@/assets/images/ai-providers/gemma-color.svg') },
  google: { src: require('@/assets/images/ai-providers/google-color.svg') },
  grok: { src: require('@/assets/images/ai-providers/grok.svg'), mono: true },
  groq: { src: require('@/assets/images/ai-providers/groq.svg'), mono: true },
  // `kimi-color` is mostly white, which disappears on the light theme backgrounds.
  kimi: { src: require('@/assets/images/ai-providers/kimi.svg'), mono: true },
  meta: { src: require('@/assets/images/ai-providers/meta-color.svg') },
  minimax: { src: require('@/assets/images/ai-providers/minimax-color.svg') },
  mistral: { src: require('@/assets/images/ai-providers/mistral-color.svg') },
  moonshot: { src: require('@/assets/images/ai-providers/moonshot.svg'), mono: true },
  openai: { src: require('@/assets/images/ai-providers/openai.svg'), mono: true },
  perplexity: { src: require('@/assets/images/ai-providers/perplexity-color.svg') },
  qwen: { src: require('@/assets/images/ai-providers/qwen-color.svg') },
  siliconcloud: { src: require('@/assets/images/ai-providers/siliconcloud-color.svg') },
  together: { src: require('@/assets/images/ai-providers/together-color.svg') },
  vercel: { src: require('@/assets/images/ai-providers/vercel.svg'), mono: true },
  xai: { src: require('@/assets/images/ai-providers/xai.svg'), mono: true },
  zai: { src: require('@/assets/images/ai-providers/zai.svg'), mono: true },
  zhipu: { src: require('@/assets/images/ai-providers/zhipu-color.svg') },
}

/** Provider `value` from `AImodelsOptions` -> icon brand. */
const PROVIDER_BRANDS: Record<string, string> = {
  OpenAI: 'openai',
  DeepSeek: 'deepseek',
  Anthropic: 'anthropic',
  xAI: 'xai',
  Google: 'google',
  'Azure OpenAI': 'azure',
  SiliconFlow: 'siliconcloud',
  Alibaba: 'alibaba',
  Mistral: 'mistral',
  Groq: 'groq',
  Cohere: 'cohere',
  'Together AI': 'together',
  Fireworks: 'fireworks',
  DeepInfra: 'deepinfra',
  Cerebras: 'cerebras',
  'Moonshot AI': 'moonshot',
  MiniMax: 'minimax',
  'Z.AI': 'zai',
  Perplexity: 'perplexity',
  'Vercel AI Gateway': 'vercel',
}

/**
 * Model id fragment -> series icon brand, checked in order so that the first match wins.
 * A model of a known family gets its family logo (Claude, Gemini, Grok, Qwen, Kimi, GLM, ...),
 * everything else falls back to the provider icon.
 */
const MODEL_BRANDS: Record<string, string> = {
  claude: 'claude',
  gemini: 'gemini',
  gemma: 'gemma',
  grok: 'grok',
  qwen: 'qwen',
  qwq: 'qwen',
  kimi: 'kimi',
  glm: 'zhipu',
  llama: 'meta',
  mistral: 'mistral',
  mixtral: 'mistral',
  magistral: 'mistral',
  ministral: 'mistral',
  codestral: 'mistral',
  command: 'cohere',
  minimax: 'minimax',
  deepseek: 'deepseek',
  sonar: 'perplexity',
  'gpt-': 'openai',
}

/** Icon brand that represents a provider on its own. */
export const providerIconBrand = (provider: string): string | undefined => PROVIDER_BRANDS[provider]

/** Icon brand of the model's series, when its id belongs to a known family. */
export const modelIconBrand = (model: string): string | undefined => {
  const id = model.toLowerCase()
  for (const [fragment, brand] of Object.entries(MODEL_BRANDS)) {
    if (id.includes(fragment)) return brand
  }
  return undefined
}

/**
 * Icon asset for a provider, using the model's series icon when the id belongs to one.
 * Returns `undefined` for an unknown provider so callers can skip the icon.
 */
export const resolveProviderIcon = (provider: string, model?: string): ProviderIconAsset | undefined => {
  const brand = (model ? modelIconBrand(model) : undefined) ?? providerIconBrand(provider)
  return brand ? PROVIDER_ICONS[brand] : undefined
}
