import { nativeTheme } from 'electron'

export const onSystemThemeChanged = (switchTheme: (theme: Theme) => void) => {
  const getCurrentTheme = (): Theme => {
    return nativeTheme.shouldUseDarkColors ? 'night' : 'light'
  }
  nativeTheme.addListener('updated', () => {
    const theme = getCurrentTheme()
    switchTheme(theme)
  })
}

export default {}
