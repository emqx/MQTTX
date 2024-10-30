import { createRouter, createWebHashHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import useMockData from '@/composables/useMockData'

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

const { getFirstConnectionId } = useMockData()

router.beforeEach((to, _from, next) => {
  if (to.name === '/connections/') {
    console.log('Route to Connections Page')
    const firstConnectionId = getFirstConnectionId()
    if (firstConnectionId) {
      next(`/connections/${firstConnectionId}`)
      return
    }
    next()
  } else {
    next()
  }
})
