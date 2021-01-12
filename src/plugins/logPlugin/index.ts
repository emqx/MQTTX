import log4js from 'log4js'
import _Vue from 'vue'

// Plugin object
const VueLog4js = {
  // Required methow initially called when instatiated
  install(Vue: typeof _Vue, options?: any) {
    // Configure Log4js
    log4js.configure(options)

    Vue.$log = log4js.getLogger()

    // Attach logger to Vue instance
    Vue.prototype.$log = Vue.$log
  },
}

export default VueLog4js
