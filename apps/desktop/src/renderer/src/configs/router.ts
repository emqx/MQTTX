type ComponentResolver = () => Promise<any>

export const routerComponentMap: Record<string, ComponentResolver> = {
  ConnectionsComponent: () => import('@/pages/connections/Index.vue'),
  ConnectionDetailsComponent: () => import('@/pages/connections/Details.vue'),
}

export default {}
