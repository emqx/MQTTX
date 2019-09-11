import Home from '../views/Home.vue'
import Connections from '../views/connections/index.vue'
import Brokers from '../views/brokers/index.vue'
import Settings from '../views/settings/index.vue'

const routes: Routes[] = [
  {
    path: '/',
    redirect: '/recent_connections',
    component: Home,
    children: [
      { path: '/recent_connections', component: Connections },
      { path: '/brokers', component: Brokers },
      { path: '/clients', component: Brokers },
      { path: '/settings', component: Settings },
    ],
  },
]

export default routes
