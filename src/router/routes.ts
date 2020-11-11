import Home from '../views/Home.vue'

const routes: Routes[] = [
  {
    path: '/',
    redirect: '/recent_connections',
    name: 'Home',
    component: Home,
    children: [
      { path: '/recent_connections', name: 'Connections', component: () => import('../views/connections/index.vue') },
      {
        path: '/recent_connections/:id',
        name: 'ConnectionDetails',
        component: () => import('../views/connections/index.vue'),
      },
      { path: '/settings', name: 'Settings', component: () => import('../views/settings/index.vue') },
      { path: '/about', name: 'About', component: () => import('../views/about/index.vue') },
      { path: '/new_window/:id', name: 'newWindow', component: () => import('../views/window/Window.vue') },
    ],
  },
]

export default routes
