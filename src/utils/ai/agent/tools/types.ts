import type useServices from '@/database/useServices'
import type { ConnectionBridge } from '../connectionBridge'
import type { PermissionMode } from '../approval'

/**
 * Dependencies of the MQTT tools.
 *
 * Nothing is imported directly so the tools can be unit tested with fakes.
 */
export interface AgentToolDeps {
  bridge: ConnectionBridge
  services: Pick<
    ReturnType<typeof useServices>,
    'connectionService' | 'messageService' | 'topicNodeService' | 'collectionService'
  >
  store: { getters: any; dispatch: (type: string, payload?: any) => Promise<any> }
  router: {
    push: (location: string) => Promise<any>
    currentRoute: { path: string; query: any; params: any }
  }
  getPermissionMode: () => PermissionMode
}
