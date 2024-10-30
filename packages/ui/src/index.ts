import 'element-plus/dist/index.css'
import './styles/index.scss'
import './assets/fonts/iconfont'

import type { App } from 'vue'
import { createPinia } from 'pinia'

import ConnectionListView from './components/connections/ListView.vue'
import ConnectionDetailsView from './components/connections/DetailsView.vue'
import EmptyView from './components/common/EmptyView.vue'
import LeftMenu from './components/common/LeftMenu.vue'
import MainView from './components/common/MainView.vue'
import SplitView from './components/common/SplitView.vue'

export const pinia = createPinia()

export * from './stores'
export * from './i18n'

export { ConnectionListView, ConnectionDetailsView, EmptyView, LeftMenu, MainView, SplitView }

export default {
  install: (app: App) => {
    app.component('ConnectionListView', ConnectionListView)
    app.component('ConnectionDetailsView', ConnectionDetailsView)
    app.component('EmptyView', EmptyView)
    app.component('LeftMenu', LeftMenu)
    app.component('MainView', MainView)
    app.component('SplitView', SplitView)
  },
}
