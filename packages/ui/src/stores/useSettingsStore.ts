import type { Lang, Theme } from 'mqttx'
import { i18n } from '../i18n'

function settingsStoreSetup() {
  const theme = ref<Theme>('dark')
  function changeTheme(val: Theme) {
    theme.value = val
  }

  const getLang = (): Lang => {
    const lang = localStorage.getItem('lang')
    return (lang as Lang) || 'en'
  }

  const lang = ref<Lang>(getLang())

  function changeLang(val: Lang) {
    lang.value = val
    localStorage.setItem('lang', val)
  }

  // Automatically update the i18n locale when the language is changed
  watch(
    lang,
    (newLang) => {
      i18n.global.locale = newLang
    },
    { immediate: true },
  )

  return { theme, changeTheme, lang, changeLang }
}

export const useSettingsStore = defineStore('settings', settingsStoreSetup)
