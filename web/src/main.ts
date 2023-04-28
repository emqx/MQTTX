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
import VueVirtualScroller from 'vue-virtual-scroller'
import VueRx from 'vue-rx'
import VueGtm, { VueGtmUseOptions } from '@gtm-support/vue2-gtm'

Vue.use(element)
Vue.use(VueI18n)
Vue.use(VueClipboard)
Vue.use(VueVirtualScroller)
Vue.use(VueRx)
Vue.use(VueGtm, {
  id: 'GTM-K487G9S',
  enabled: process.env.NODE_ENV === 'production' && process.env.BASE_URL === '/online-mqtt-client/',
  debug: false,
} as VueGtmUseOptions)

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
