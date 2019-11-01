import Vue from 'vue'
import Router from 'vue-router'
import routes from './routes'
import { loadBrokers } from '@/utils/api/broker'
import { loadConnections } from '@/utils/api/connection'
import { BrokerModel } from '@/views/brokers/types'
import { ConnectionModel } from '@/views/Connections/types'

Vue.use(Router)

const router: Router = new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.name === 'Brokers') {
    const brokers: BrokerModel[] | [] = loadBrokers() || []
    if (brokers.length) {
      next({ path: `/brokers/${brokers[0].id}` })
    } else {
      next()
    }
  } else if (to.name === 'Connections') {
    const connections: ConnectionModel[] | [] = loadConnections() || []
    if (connections.length) {
      next({ path: `/recent_connections/${connections[0].id}` })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
