import type { App } from 'vue'

import AboutDataCollectionPolicy from './components/about/DataCollectionPolicy.vue'
import AboutFooter from './components/about/Footer.vue'
import AboutInfo from './components/about/Info.vue'
import AboutView from './components/about/View.vue'
import EmptyView from './components/common/EmptyView.vue'
import LeftMenu from './components/common/LeftMenu.vue'
import MainView from './components/common/MainView.vue'
import SplitView from './components/common/SplitView.vue'
import ConnectionDetailsView from './components/connections/DetailsView.vue'
import ConnectionListView from './components/connections/ListView.vue'
import HelpView from './components/HelpView.vue'
import LogView from './components/LogView.vue'
import MonacoEditor from './components/MonacoEditor.vue'
import MyDialog from './components/MyDialog.vue'
import ScriptView from './components/script/View.vue'
import SettingsView from './components/SettingsView.vue'

export * from './components/monacoEnvironment'

export * from './i18n'
export * from './stores'

export {
  AboutDataCollectionPolicy,
  AboutFooter,
  AboutInfo,
  AboutView,
  ConnectionDetailsView,
  ConnectionListView,
  EmptyView,
  HelpView,
  LeftMenu,
  LogView,
  MainView,
  MonacoEditor,
  MyDialog,
  ScriptView,
  SettingsView,
  SplitView,
}

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
