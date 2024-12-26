import type { PlatformType } from 'mqttx'
import useSettingsService from '@database/services/SettingsService'
import { monacoEnvironment } from '@mqttx/ui'

import { i18n } from '@mqttx/ui/i18n'
import App from './App.vue'

import { router } from './router'
import '@mqttx/ui/styles.scss'
import './assets/scss/main.scss'

monacoEnvironment()

// Create Vue
const app = createApp(App)
const pinia = createPinia()

app.provide<PlatformType>('platformType', 'desktop')

app.use(router).use(pinia)

const { getSettingsInDB } = useSettingsService()

getSettingsInDB().then(() => {
  // I18n
  const { settings } = useSettingsService()
  i18n.global.locale = settings.currentLang

  app.use(i18n).mount('#app')
})
