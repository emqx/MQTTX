import { createRouter, createWebHashHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'

routes.push({
  path: '/',
  redirect: '/connections',
})

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// This will update routes at runtime without reloading the page
if (import.meta.hot) {
  handleHotUpdate(router)
}

// const { getFirstConnectionId } = useMockData()

router.beforeEach((to, _from, next) => {
  if (to.name === '/connections/') {
    // console.log('Route to Connections Page')
    // const firstConnectionId = getFirstConnectionId()
    // if (firstConnectionId) {
    //   next(`/connections/${firstConnectionId}`)
    //   return
    // }
    next()
  } else {
    next()
  }
})
