import { ipcRenderer } from 'electron'
import { nativeTheme } from '@electron/remote'

/**
 * Theme and language changes are applied through the main process: it re-emits them so the renderer
 * updates the body class, `documentElement.lang` and the i18n locale. The Settings page and the
 * agent tools share these helpers so they run the exact same effects.
 */
export const applyThemeChange = (theme: string): void => {
  ipcRenderer.send('setting', 'theme', theme)
}

export const applyLangChange = (lang: string): void => {
  ipcRenderer.send('setting', 'lang', lang)
}

/** Theme to use when "follow the operating system theme" is switched on */
export const themeFromOs = (): 'night' | 'light' => (nativeTheme?.shouldUseDarkColors ? 'night' : 'light')
