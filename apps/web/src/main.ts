import type { PlatformType } from 'mqttx'
import { monacoEnvironment } from '@mqttx/ui'
import { i18n } from '@mqttx/ui/i18n'

import App from './App.vue'
import { createDatabase } from './database'

import useSettingsService from './database/services/SettingsService'
import { router } from './router'
import '@mqttx/ui/styles.scss'
import './assets/scss/main.scss'

monacoEnvironment()

const database = createDatabase()

// Create Vue
const app = createApp(App)
const pinia = createPinia()

app.provide<PlatformType>('platformType', 'web')

app.use(router).use(pinia)

database.then(async (db) => {
  const { settings, init } = useSettingsService()
  await init()
  i18n.global.locale = settings.value.currentLang

  app.use(i18n).use(db).mount('#app')
})
