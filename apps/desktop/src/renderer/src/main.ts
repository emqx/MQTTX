import type { PlatformType } from 'mqttx'
import { initTables } from '@database/services'
import useSettingsService from '@database/services/SettingsService'

import { monacoEnvironment } from '@mqttx/ui'
import { i18n } from '@mqttx/ui/i18n'

import App from './App.vue'
import { createElectronMenuPlugin } from './plugins/electronMenu'
import { router } from './router'
import '@mqttx/ui/styles.scss'
import './assets/scss/main.scss'

monacoEnvironment()

// Create Vue
const app = createApp(App)
const pinia = createPinia()
const electronMenuPlugin = createElectronMenuPlugin()

app.provide<PlatformType>('platformType', 'desktop')

app.use(router).use(pinia).use(electronMenuPlugin)

initTables().then(() => {
  const { settings } = useSettingsService()
  i18n.global.locale = settings.value.currentLang
  app.use(i18n).mount('#app')
})
