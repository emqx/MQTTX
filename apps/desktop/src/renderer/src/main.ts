import '@mqttx/ui/dist/style.css'
import './assets/scss/main.scss'

import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'

import { router } from './router'
import MqttxUI, { pinia, i18n, useSettingsStore } from '@mqttx/ui'

// Create Vue
const app = createApp(App)

app.use(router).use(pinia).use(MqttxUI)

// I18n
const settingsStore = useSettingsStore()
i18n.global.locale = settingsStore.lang

app.use(ElementPlus).use(i18n).mount('#app')
