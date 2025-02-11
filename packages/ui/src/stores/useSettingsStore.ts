import type { Settings } from 'mqttx'
import { usePreferredDark } from '@vueuse/core'
import { i18n } from '../i18n'

const isDark = usePreferredDark()

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

  watch(isDark, (value) => {
    if (!settings.value?.syncOsTheme) return
    settings.value!.currentTheme = value ? 'dark' : 'light'
  })

  watch(() => settings.value?.syncOsTheme, (value) => {
    if (!value) return
    settings.value!.currentTheme = isDark.value ? 'dark' : 'light'
  })

  watch(() => settings.value?.currentTheme, (value) => {
    document.documentElement.className = value || 'light'
  })

  return { settings, updateSettings }
})
