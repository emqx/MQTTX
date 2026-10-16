import { ToolSet } from 'ai'
import { AgentToolDeps } from './types'
import { createConnectionTools } from './connections'
import { createMessagingTools } from './messaging'
import { createAppContextTools } from './appContext'

export type { AgentToolDeps } from './types'
export { buildAppContext, renderAppContext } from './appContext'
export type { AppContext } from './appContext'

/** Tools that change state and therefore need approval in `ask` mode */
export const AGENT_WRITE_TOOLS = new Set([
  'create_connection',
  'update_connection',
  'delete_connection',
  'connect',
  'disconnect',
  'subscribe',
  'unsubscribe',
  'publish',
])

/** Every MQTT tool, used to tell MQTT tools apart from MCP tools */
export const createMQTTTools = (deps: AgentToolDeps): ToolSet => ({
  ...createConnectionTools(deps),
  ...createMessagingTools(deps),
  ...createAppContextTools(deps),
})
