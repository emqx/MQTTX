import log4js from 'log4js'
import _Vue from 'vue'
import store from '@/store'

// Plugin object
const VueLog4js = {
  // Required methow initially called when instatiated
  install(Vue: typeof _Vue, options?: log4js.Configuration) {
    // Configure Log4js
    const config = options || {
      appenders: { out: { type: 'stdout' } },
      categories: { default: { appenders: ['out'], level: 'info' } },
    }

    config.categories.default.level = store.getters.logLevel

    log4js.configure(config)

    const $log = log4js.getLogger()

    // Attach logger to Vue instance
    Vue.prototype.$log = $log
    Vue.prototype.$logRegsity = log4js.getLogger
  },
}

export default VueLog4js
