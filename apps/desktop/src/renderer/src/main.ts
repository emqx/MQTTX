import useSettingsService from '@database/services/SettingsService'
import { i18n } from '@mqttx/ui/i18n'

import App from './App.vue'
import { router } from './router'

import '@mqttx/ui/styles.scss'
import './assets/scss/main.scss'

// Create Vue
const app = createApp(App)

const pinia = createPinia()

app.use(router).use(pinia)

const { getSettingsInDB } = useSettingsService()

getSettingsInDB().then(() => {
  // I18n
  const { settings } = useSettingsService()
  i18n.global.locale = settings.currentLang

  app.use(i18n).mount('#app')
})
