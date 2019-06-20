import Vue from 'vue'

import 'element-ui/lib/theme-chalk/index.css'
import ElementLocale from 'element-ui/lib/locale'

import App from './App.vue'
import router from './router'
import store from './store'
import VueI18n from 'vue-i18n'
import Lang from './lang'
import element from './utils/element'

Vue.use(element)
Vue.use(VueI18n)

const vueI18n: VueI18n = new VueI18n({
  locale: 'zh',
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
