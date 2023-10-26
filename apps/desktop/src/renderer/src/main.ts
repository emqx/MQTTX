import '@mqttx/ui/dist/style.css'
import './assets/scss/main.scss'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { createRouter, createWebHashHistory } from 'vue-router'
import MqttxUI, { getRoutes, createRouterGuard, pinia } from '@mqttx/ui'
import useMockData from '@/composables/useMockData'
import { routerComponentMap } from './configs/router'
import App from './App.vue'

// Router
const routes = getRoutes(routerComponentMap)
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
const { getFirstConnectionId } = useMockData()
router.beforeEach(createRouterGuard(getFirstConnectionId))

// Create Vue
const app = createApp(App).use(ElementPlus).use(MqttxUI).use(router).use(pinia)
app.mount('#app')
