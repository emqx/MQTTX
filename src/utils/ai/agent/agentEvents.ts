import { globalEventBus } from '@/utils/globalEventBus'

/** Parts of the app the agent can change; pages listen for their domain and reload */
export type AgentDataDomain = 'connections' | 'messages' | 'scripts' | 'topic-tree' | 'dashboards'

export const AGENT_DATA_CHANGED = 'agent:data-changed'

export interface AgentDataChangedPayload {
  domain: AgentDataDomain
  connectionId?: string
}

/** Tells the open pages that the agent changed their data */
export const emitAgentDataChanged = (domain: AgentDataDomain, connectionId?: string): void => {
  globalEventBus.emit(AGENT_DATA_CHANGED, { domain, connectionId } as AgentDataChangedPayload)
}
