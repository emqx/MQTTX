import type { PlatformType } from 'mqttx'
import { initTables, useSettingsService } from '@/database/services'
import { createGtm } from '@gtm-support/vue-gtm'

import { monacoEnvironment } from '@mqttx/ui'
import { i18n } from '@mqttx/ui/i18n'

import App from './App.vue'
import { createDatabase } from './database'
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

app.use(createGtm({
  id: 'GTM-KHSFXHT',
  enabled: import.meta.env.VITE_APP_IS_ONLINE_ENV === 'true',
  debug: false,
}))

database.then(async (db) => {
  await initTables()
  const { settings } = useSettingsService()
  i18n.global.locale = settings.value.currentLang

  app.use(i18n).use(db).mount('#app')
})
