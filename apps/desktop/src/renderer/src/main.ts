import { i18n, pinia, useSettingsStore } from '@mqttx/ui'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'

import '@mqttx/ui/dist/style.css'
import './assets/scss/main.scss'

// Create Vue
const app = createApp(App)

app.use(router).use(pinia)

// I18n
const settingsStore = useSettingsStore()
i18n.global.locale = settingsStore.lang

app.use(i18n).mount('#app')
