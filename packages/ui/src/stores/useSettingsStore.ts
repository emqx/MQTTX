import { ref } from 'vue'
import { defineStore } from 'pinia'

const settingsStoreSetup = () => {
  const theme = ref('dark')
  function changeTheme(val: 'light' | 'dark') {
    theme.value = val
  }

  return { theme, changeTheme }
}

export const useSettingsStore = defineStore('settings', settingsStoreSetup)
