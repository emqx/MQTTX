import 'element-plus/dist/index.css'
import './styles/index.scss'

import type { App } from 'vue'

import ConnectionListView from './components/connections/ListView.vue'
import ConnectionDetailsView from './components/connections/DetailsView.vue'
import EmptyView from './components/common/EmptyView.vue'

export * from './router'

export { ConnectionListView, ConnectionDetailsView, EmptyView }

export default {
  install: (app: App) => {
    app.component('ConnectionListView', ConnectionListView)
    app.component('ConnectionDetailsView', ConnectionDetailsView)
    app.component('EmptyView', EmptyView)
  },
}
