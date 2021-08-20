import Vue from 'vue'
import Router from 'vue-router'
import routes from './routes'
import useServices from '@/database/useServices'

Vue.use(Router)

const router: Router = new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  scrollBehavior(to, from, savedPosition) {
    if (to.meta.keepAlive && savedPosition) {
      return savedPosition
    }
    return { x: 0, y: 0 }
  },
  routes,
})

// Fix Uncaught (in promise) NavigationDuplicated {_name: "NavigationDuplicated"}
const originalPush = Router.prototype.push
Router.prototype.push = function push(location: string) {
  const callRes: $TSFixed = originalPush.call(this, location)
  return callRes.catch((err: Error) => err)
}

router.beforeEach(async (to, from, next) => {
  if (to.name === 'Connections') {
    const { connectionService } = useServices()
    // TODO: Need more test
    // maybe we should not use async inside the foreach loop
    const connections: ConnectionModel[] | [] = (await connectionService.getAll()) || []
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
