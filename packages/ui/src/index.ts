import 'element-plus/dist/index.css'
import './styles/index.scss'

import { App } from 'vue'

import MyComponent from './components/MyComponent.vue'

export { MyComponent }

export default {
  install: (app: App) => {
    app.component('MyComponent', MyComponent)
  },
}
