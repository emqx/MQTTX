import Vue from 'vue'
import Vuex from 'vuex'

import app from './modules/app'
import getters from './getter'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    app,
  },
  getters,
})
