import Home from '../views/Home.vue'
import Connections from '../views/connections/index.vue'
import Brokers from '../views/brokers/index.vue'
import Settings from '../views/settings/index.vue'

const routes: Routes[] = [
  {
    path: '/',
    redirect: '/recent_connections',
    name: 'Home',
    component: Home,
    children: [
      { path: '/recent_connections', name: 'Connections', component: Connections },
      { path: '/brokers', name: 'Brokers', component: Brokers },
      { path: '/brokers/:id', name: 'BrokerDetails', component: Brokers },
      { path: '/clients/:id', name: 'Clients', component: Brokers },
      { path: '/settings', name: 'Settings', component: Settings },
    ],
  },
]

export default routes
