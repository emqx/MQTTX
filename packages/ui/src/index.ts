import type { App } from 'vue'
import EmptyView from './components/common/EmptyView.vue'

import LeftMenu from './components/common/LeftMenu.vue'
import MainView from './components/common/MainView.vue'

import SplitView from './components/common/SplitView.vue'
import ConnectionDetailsView from './components/connections/DetailsView.vue'
import ConnectionListView from './components/connections/ListView.vue'

export const pinia = createPinia()

export * from './i18n'
export * from './stores'

export { ConnectionDetailsView, ConnectionListView, EmptyView, LeftMenu, MainView, SplitView }

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
