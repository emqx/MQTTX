import Home from '../views/Home.vue'
import Connections from '../views/connections/index.vue'
import Settings from '../views/settings/index.vue'
import About from '../views/about/index.vue'

const routes: Routes[] = [
  {
    path: '/',
    redirect: '/recent_connections',
    name: 'Home',
    component: Home,
    children: [
      { path: '/recent_connections', name: 'Connections', component: Connections },
      { path: '/recent_connections/:id', name: 'ConnectionDetails', component: Connections },
      { path: '/settings', name: 'Settings', component: Settings },
      { path: '/about', name: 'About', component: About },
    ],
  },
]

export default routes
