/**
 * Unified way for the dashboard charts to read the active theme.
 *
 * Charts cannot rely on CSS for their colours, so they read the same custom
 * properties the themes paint with (see `src/assets/scss/theme/*.scss`) instead
 * of hard-coding per-theme hex values. The components already watch the
 * `currentTheme` getter and rebuild the chart on theme change, so reading the
 * live values here keeps light / dark / night in sync.
 */
export interface ChartThemeColors {
  /** Primary text: axis labels, tooltips */
  text: string
  /** Secondary text: units, captions */
  subText: string
  /** Strong text: the main value */
  title: string
  /** Axis lines */
  axis: string
  /** Split lines / track backgrounds */
  splitLine: string
  /** Popper / tooltip surface */
  surface: string
  /** Popper / tooltip border */
  border: string
}

// Light theme values, used when a variable is missing (e.g. in tests).
const FALLBACK: ChartThemeColors = {
  text: '#616161',
  subText: '#a2a9b0',
  title: '#222b3b',
  axis: '#e6e8f1',
  splitLine: '#e6e8f1',
  surface: '#ffffff',
  border: '#e6e8f1',
}

// Charts re-read these on every data point, so the result is memoized per
// theme. The theme is applied by setting `body.className` (see Home.vue's
// setTheme), which makes the class a safe cache key.
let cachedThemeClass: string | null = null
let cachedColors: ChartThemeColors | null = null

export const getChartThemeColors = (): ChartThemeColors => {
  if (typeof window === 'undefined' || !document.body) {
    return { ...FALLBACK }
  }

  const themeClass = document.body.className
  if (cachedColors && cachedThemeClass === themeClass) return cachedColors

  const styles = getComputedStyle(document.body)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  cachedColors = {
    text: read('--color-text-default', FALLBACK.text),
    subText: read('--color-text-light', FALLBACK.subText),
    title: read('--color-text-title', FALLBACK.title),
    axis: read('--color-border-default', FALLBACK.axis),
    splitLine: read('--color-border-default', FALLBACK.splitLine),
    surface: read('--color-bg-messagebox', FALLBACK.surface),
    border: read('--color-border-default', FALLBACK.border),
  }
  cachedThemeClass = themeClass
  return cachedColors
}
