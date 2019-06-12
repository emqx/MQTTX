import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Connections from './views/connections/index.vue'
import Brokers from './views/brokers/index.vue'
import Settings from './views/settings/index.vue'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: '/recent_connections',
      component: Home,
      children: [
        { path: '/recent_connections', component: Connections },
        { path: '/brokers', component: Brokers },
        { path: '/settings', component: Settings },
      ],
    },
  ],
})
