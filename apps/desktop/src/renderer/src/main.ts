import '@mqttx/ui/dist/style.css'
import './assets/scss/main.scss'

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import MqttxUI from '@mqttx/ui'
import App from './App.vue'

const app = createApp(App).use(ElementPlus).use(MqttxUI)
app.mount('#app')
