import 'element-plus/dist/index.css'
import './styles/index.scss'
import './assets/fonts/iconfont'

import type { App } from 'vue'
import { createPinia } from 'pinia'

import ConnectionListView from './components/connections/ListView.vue'
import ConnectionDetailsView from './components/connections/DetailsView.vue'
import EmptyView from './components/common/EmptyView.vue'
import LeftBar from './components/common/LeftBar.vue'

export const pinia = createPinia()

export * from './router'
export * from './stores'

export { ConnectionListView, ConnectionDetailsView, EmptyView, LeftBar }

export default {
  install: (app: App) => {
    app.component('ConnectionListView', ConnectionListView)
    app.component('ConnectionDetailsView', ConnectionDetailsView)
    app.component('EmptyView', EmptyView)
    app.component('LeftBar', LeftBar)
  },
}
