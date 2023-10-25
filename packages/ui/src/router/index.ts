import routesMeta from './routes.json'
import type { RouteRecordRaw } from 'vue-router'

type ComponentMapType = {
  [key: string]: () => any
}

interface CustomRoute {
  path: string
  redirect?: string
  name?: string
  component?: string
  children?: CustomRoute[]
  props?: boolean
}

const resolveComponents = (routes: CustomRoute[], componentMap: ComponentMapType): RouteRecordRaw[] => {
  return (
    routes
      .filter((route) => !route.component || (route.component && componentMap[route.component]))
      // Filter out components that do not exist in the componentMap
      .map((route) => {
        const updatedRoute: RouteRecordRaw = { ...route } as RouteRecordRaw
        if (route.component && typeof route.component === 'string' && componentMap[route.component]) {
          updatedRoute.component = componentMap[route.component]
        }
        if (route.children) {
          updatedRoute.children = resolveComponents(route.children, componentMap)
        }
        return updatedRoute
      })
  )
}

export const getRoutes = (componentMap: ComponentMapType): RouteRecordRaw[] => {
  const basedRoutes: CustomRoute[] = routesMeta
  return resolveComponents(basedRoutes, componentMap)
}

import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

type GetFirstConnectionIdCallback = () => string | null

export const createRouterGuard = (getFirstConnectionId: GetFirstConnectionIdCallback) => {
  return (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (to.name === 'Connections' && !to.params.id) {
      const firstConnectionId = getFirstConnectionId()
      if (firstConnectionId) {
        next(`/connections/${firstConnectionId}`)
        return
      }
    }
    next()
  }
}
