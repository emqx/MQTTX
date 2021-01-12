import Vue from 'vue'

import 'element-ui/lib/theme-chalk/index.css'
import ElementLocale from 'element-ui/lib/locale'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
import VueI18n from 'vue-i18n'
import VueClipboard from 'vue-clipboard2'
import Lang from './lang'
import element from './utils/element'
import VueLog4js from './plugins/logPlugin/index'
import log4js from 'log4js'
import { getOrCreateLogDir } from './utils/logger'
import logConfig from './plugins/logPlugin/logConfig.json'

// set logFile dir
const LOG_DIR = getOrCreateLogDir()
const LOG_PATH = `${LOG_DIR}/log`
logConfig.appenders.fileOutput.filename = LOG_PATH
const config: log4js.Configuration = logConfig

Vue.use(element)
Vue.use(VueI18n)
Vue.use(VueClipboard)
Vue.use(VueLog4js, config)

const locale: Language = store.state.app.currentLang
const vueI18n: VueI18n = new VueI18n({
  locale,
  messages: Lang,
})
const { i18n }: any = ElementLocale
i18n((key: any, value: any) => vueI18n.t(key, value))

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n: vueI18n,
  render: (h) => h(App),
}).$mount('#app')
