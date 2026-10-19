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

export const getChartThemeColors = (): ChartThemeColors => {
  if (typeof window === 'undefined' || !document.body) {
    return { ...FALLBACK }
  }
  const styles = getComputedStyle(document.body)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  return {
    text: read('--color-text-default', FALLBACK.text),
    subText: read('--color-text-light', FALLBACK.subText),
    title: read('--color-text-title', FALLBACK.title),
    axis: read('--color-border-default', FALLBACK.axis),
    splitLine: read('--color-border-default', FALLBACK.splitLine),
    surface: read('--color-bg-messagebox', FALLBACK.surface),
    border: read('--color-border-default', FALLBACK.border),
  }
}
