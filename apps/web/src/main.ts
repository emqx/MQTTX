import { i18n } from '@mqttx/ui/i18n'
import { useSettingsStore } from '@mqttx/ui/stores'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'

import '@mqttx/ui/styles.scss'
import './assets/scss/main.scss'

// Create Vue
const app = createApp(App)

const pinia = createPinia()

app.use(router).use(pinia)

// I18n
const settingsStore = useSettingsStore()
i18n.global.locale = settingsStore.lang

app.use(i18n).mount('#app')
