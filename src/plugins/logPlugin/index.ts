import log4js from 'log4js'
import _Vue from 'vue'

// Plugin object
const VueLog4js = {
  // Required methow initially called when instatiated
  install(Vue: typeof _Vue, options?: any) {
    // Configure Log4js
    log4js.configure(options)

    const $log = log4js.getLogger()

    // Attach logger to Vue instance
    Vue.prototype.$log = $log
    Vue.prototype.$logRegsity = log4js.getLogger
  },
}

export default VueLog4js
