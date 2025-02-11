import type { Settings } from 'mqttx'
import { BrowserWindow, nativeTheme } from 'electron'
import Store from 'electron-store'

// FIXME: https://github.com/sindresorhus/electron-store/issues/276
const store = new Store() as any

export const bgColor = {
  dark: '#232323',
  night: '#212328',
  light: '#ffffff',
}

export function setNativeTheme() {
  const settings = store.get('settings') as Settings | undefined
  const { syncOsTheme = false, currentTheme = 'light' } = settings || {}
  if (syncOsTheme) {
    nativeTheme.themeSource = 'system'
  } else {
    const nativeThemeMode = currentTheme === 'light' ? 'light' : 'dark'
    nativeTheme.themeSource = nativeThemeMode
  }
  const color = bgColor[currentTheme]
  BrowserWindow.getAllWindows().forEach((window) => {
    window.setBackgroundColor(color)
  })
}
