import type { Settings } from 'mqttx'
import { i18n } from '../i18n'

export const useSettingsStore = defineStore('settings', () => {
  // mokc db 中的 settings
  const settingsDB: Settings = {
    currentLang: 'en',
    autoCheck: true,
    autoResub: true,
    multiTopics: false,
    maxReconnectTimes: 3,
    syncOsTheme: true,
    currentTheme: 'dark',
    jsonHighlight: true,
    logLevel: 'debug',
    ignoreQoS0Message: false,
    enableCopilot: false,
    openAIAPIHost: '',
    openAIAPIKey: '',
    model: '',
  }

  const settings = ref<Settings>(settingsDB)

  function updateSettings(newSettings: Settings) {
    settings.value = newSettings
  }

  // Automatically update the i18n locale when the language is changed
  watch(() => settings.value.currentLang, (newLang) => {
    i18n.global.locale = newLang
  })

  return { settings, updateSettings }
})
