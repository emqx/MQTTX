import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { AgentToolDeps } from './types'
import { PermissionMode } from '../approval'

export interface AppContext {
  page: string
  currentConnection: {
    id: string
    name: string
    connected: boolean
    mqttVersion?: string
    url?: string
  } | null
  permissionMode: PermissionMode
}

/** Describes what the user is looking at right now; injected into the instructions, never stored */
export const buildAppContext = (deps: AgentToolDeps): AppContext => {
  const route = deps.router.currentRoute
  const view = deps.bridge.current()
  const record = view?.record
  return {
    page: route.path,
    currentConnection:
      view && record?.id
        ? {
            id: record.id,
            name: record.name,
            connected: view.getClient().connected === true,
            mqttVersion: record.mqttVersion,
            url: `${record.protocol}://${record.host}:${record.port}`,
          }
        : null,
    permissionMode: deps.getPermissionMode(),
  }
}

export const renderAppContext = (context: AppContext): string => {
  const lines = ['## Current MQTTX state', `- Page: ${context.page}`]
  if (context.currentConnection) {
    const { name, id, connected, mqttVersion, url } = context.currentConnection
    lines.push(
      `- Current connection: "${name}" (id: ${id}, connected: ${connected}${
        mqttVersion ? `, MQTT ${mqttVersion}` : ''
      }${url ? `, ${url}` : ''})`,
    )
  } else {
    lines.push('- Current connection: none')
  }
  lines.push(`- Permission mode: ${context.permissionMode}`)
  return lines.join('\n')
}

export const createAppContextTools = (deps: AgentToolDeps): ToolSet => ({
  get_app_context: tool({
    title: 'Check MQTTX state',
    description: 'Read the page and connection currently open in MQTTX, and the active permission mode.',
    inputSchema: z.object({}),
    execute: async () => buildAppContext(deps),
  }),
})
