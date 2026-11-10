import { ToolSet } from 'ai'
import { AgentToolDeps } from './types'
import { createConnectionTools } from './connections'
import { createMessagingTools } from './messaging'
import { createAppContextTools } from './appContext'
import { createSkillTools } from './skills'
import { createFileTools } from './files'
import { createCertificateTools } from './certificates'
import { createScriptTools } from './scripts'
import { createTopicTreeTools } from './topicTree'
import { createDashboardTools } from './dashboards'
import { createGroupTools } from './groups'
import { createSettingsTools } from './settings'
import { createLogTools } from './logs'
import { createPageTools } from './pages'

/** Tools that change user data or external state and therefore need approval in `ask` mode */
export const AGENT_WRITE_TOOLS = new Set([
  'create_connection',
  'create_zero_emqx_connection',
  'update_connection',
  'delete_connection',
  'connect',
  'disconnect',
  'subscribe',
  'unsubscribe',
  'publish',
  'stop_timed_publish',
  'save_script',
  'delete_script',
  'test_script',
  'apply_script',
  'clear_applied_script',
  'sync_topic_tree',
  'clear_topic_tree',
  'save_dashboard',
  'save_widget',
  'delete_dashboard',
  'delete_widget',
  'clear_messages',
  'save_group',
  'delete_group',
  'update_settings',
])

/**
 * Tools that must be approved even in `auto` mode and can never be remembered.
 * Irreversible deletes and script changes always ask.
 */
export const AGENT_ALWAYS_ASK_TOOLS = new Set([
  'save_script',
  'test_script',
  'apply_script',
  'delete_connection',
  'delete_script',
  'delete_dashboard',
  'delete_widget',
  'delete_group',
  'clear_messages',
  'clear_topic_tree',
])

/** Every MQTT tool, used to tell MQTT tools apart from MCP tools */
export const createMQTTTools = (deps: AgentToolDeps): ToolSet => ({
  ...createConnectionTools(deps),
  ...createMessagingTools(deps),
  ...createAppContextTools(deps),
  ...createSkillTools(),
  ...createFileTools(deps),
  ...createCertificateTools(),
  ...createScriptTools(deps),
  ...createTopicTreeTools(deps),
  ...createDashboardTools(deps),
  ...createGroupTools(deps),
  ...createSettingsTools(deps),
  ...createLogTools(),
  ...createPageTools(deps),
})
