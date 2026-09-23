export const defineColors = ['#34C388', '#6ECBEE', '#D08CF1', '#907AEF', '#EDB16E']

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// Alpha the subscription card's tint is painted at, as a CSS hex suffix.
// The topic text sits on the blend of that tint over the panel background, so
// topicTextColor() has to read the same value the template renders with -
// otherwise tuning the tint would silently invalidate the contrast guarantee.
export const TOPIC_TINT_ALPHA = '10'

// What each theme paints behind the subscription list
// (--color-bg-normal on .subscriptions-list-view).
const THEME_BACKDROP: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#262729',
  night: '#292b33',
}

// --color-text-title in the light and the dark/night themes respectively.
const DARK_TEXT = '#222b3b'
const LIGHT_TEXT = '#ffffff'

const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// WCAG 2.1 relative luminance.
const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// WCAG 2.1 contrast ratio, 1:1 (identical) to 21:1 (black on white).
const contrastRatio = (a: [number, number, number], b: [number, number, number]): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

// Source-over composite of `tint` at `alpha` onto opaque `backdrop`.
const blend = (
  backdrop: [number, number, number],
  tint: [number, number, number],
  alpha: number,
): [number, number, number] => [
  backdrop[0] * (1 - alpha) + tint[0] * alpha,
  backdrop[1] * (1 - alpha) + tint[1] * alpha,
  backdrop[2] * (1 - alpha) + tint[2] * alpha,
]

/**
 * Colour for the topic text on a subscription card.
 *
 * The card is painted as `${sub.color}${TOPIC_TINT_ALPHA}` over the panel
 * background, so the surface the text actually sits on is that blend - not
 * sub.color. Choosing from sub.color alone is wrong at the extremes: a pure
 * black pick in the light theme looks dark, which would suggest white text,
 * but the card renders ~94% white and white text on it is unreadable.
 *
 * sub.color is never modified. The colour-line swatch and the card tint render
 * the user's choice verbatim; only the text colour is derived.
 */
export const topicTextColor = (hex: string, theme: Theme): string => {
  const fallback = theme === 'light' ? DARK_TEXT : LIGHT_TEXT
  const backdrop = hexToRgb(THEME_BACKDROP[theme] ?? THEME_BACKDROP.light)
  const tint = hexToRgb(hex)
  if (!backdrop || !tint) return fallback
  const surface = blend(backdrop, tint, parseInt(TOPIC_TINT_ALPHA, 16) / 255)
  const dark = hexToRgb(DARK_TEXT) as [number, number, number]
  const light = hexToRgb(LIGHT_TEXT) as [number, number, number]
  return contrastRatio(surface, dark) >= contrastRatio(surface, light) ? DARK_TEXT : LIGHT_TEXT
}

export default {}
