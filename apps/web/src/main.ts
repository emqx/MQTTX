import '@mqttx/ui/dist/style.css'
import './assets/scss/main.scss'

import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'

import { createRouter, createWebHashHistory } from 'vue-router'
import { routerComponentMap } from './configs/router'

import MqttxUI, { getRoutes, createRouterGuard, pinia, i18n, useSettingsStore } from '@mqttx/ui'
import useMockData from '@/composables/useMockData'

// Create Vue
const app = createApp(App)

// Router
const routes = getRoutes(routerComponentMap)
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
const { getFirstConnectionId } = useMockData()
router.beforeEach(createRouterGuard(getFirstConnectionId))

app.use(router).use(pinia).use(MqttxUI)

// I18n
const settingsStore = useSettingsStore()
i18n.global.locale = settingsStore.lang

app.use(ElementPlus).use(i18n).mount('#app')
