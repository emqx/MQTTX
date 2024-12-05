import type { Settings } from 'mqttx'
import { usePreferredDark } from '@vueuse/core'
import { i18n } from '../i18n'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)

  function updateSettings(newSettings: Settings) {
    settings.value = newSettings
  }

  // Automatically update the i18n locale when the language is changed
  watch(() => settings.value?.currentLang, (newLang) => {
    if (!newLang) return
    i18n.global.locale = newLang
  })

  watch([() => settings.value?.syncOsTheme, () => settings.value?.currentTheme], ([syncOsTheme, currentTheme]) => {
    if (typeof document === 'undefined') return
    if (syncOsTheme) {
      const isDark = usePreferredDark()
      settings.value!.currentTheme = isDark.value ? 'dark' : 'light'
      document.documentElement.className = isDark.value ? 'dark' : 'light'
    } else {
      document.documentElement.className = currentTheme || 'light'
    }
  })

  return { settings, updateSettings }
})
