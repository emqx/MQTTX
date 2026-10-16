import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { getDefaultRecord } from '@/utils/mqttUtils'
import { AgentToolDeps } from './types'
import { now, sanitizeConnection } from './helpers'

const PROTOCOLS = ['mqtt', 'mqtts', 'ws', 'wss'] as const
const DEFAULT_PORTS: Record<typeof PROTOCOLS[number], number> = { mqtt: 1883, mqtts: 8883, ws: 8083, wss: 8084 }

const connectionFields = {
  name: z.string().describe('Display name of the connection'),
  host: z.string().describe('Broker host, for example broker.emqx.io'),
  port: z.number().int().min(1).max(65535).optional().describe('Broker port; defaults depend on the protocol'),
  protocol: z.enum(PROTOCOLS).optional().describe('Transport protocol, default mqtt'),
  path: z.string().optional().describe('WebSocket path, only used by ws and wss'),
  clientId: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  mqttVersion: z.enum(['3.1.1', '5.0']).optional().describe('MQTT protocol version, default 5.0'),
  clean: z.boolean().optional().describe('Clean session / clean start'),
  keepalive: z.number().int().min(0).optional().describe('Keep alive in seconds'),
  rejectUnauthorized: z.boolean().optional().describe('Verify the server certificate for mqtts/wss'),
}

/** The user is in the connection form; the agent must not touch connections then */
const assertNotEditing = (deps: AgentToolDeps): void => {
  if (deps.router.currentRoute.query?.oper) {
    throw new Error('The user is editing a connection. Ask them to save or cancel it first.')
  }
}

const uniqueName = (base: string, taken: Set<string>): string => {
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base} (${index})`)) index++
  return `${base} (${index})`
}

const isConnected = (deps: AgentToolDeps, id: string | undefined): boolean =>
  Boolean(id && deps.store.getters.activeConnection?.[id]?.client?.connected === true)

export const createConnectionTools = (deps: AgentToolDeps): ToolSet => ({
  list_connections: tool({
    title: 'List connections',
    description:
      'List every MQTT connection configured in MQTTX with its id, broker and whether it is currently connected. ' +
      'Call this first when the user refers to a connection by name, to resolve its id.',
    inputSchema: z.object({}),
    execute: async () => {
      const connections = (await deps.services.connectionService.getAll()) ?? []
      const collections = (await deps.services.collectionService.getAll()) ?? []
      const groupNames = new Map<string, string>()
      const walk = (nodes: ConnectionModelTree[]) => {
        for (const node of nodes) {
          if (node.isCollection) {
            groupNames.set(node.id, node.name)
            walk(node.children ?? [])
          }
        }
      }
      walk(collections as ConnectionModelTree[])
      return {
        connections: connections.map((connection) => ({
          id: connection.id,
          name: connection.name,
          host: connection.host,
          port: connection.port,
          protocol: connection.protocol,
          mqttVersion: connection.mqttVersion,
          clientId: connection.clientId,
          connected: isConnected(deps, connection.id),
          subscriptionCount: connection.subscriptions?.length ?? 0,
          group: connection.parentId ? groupNames.get(connection.parentId) ?? null : null,
        })),
      }
    },
  }),

  get_connection: tool({
    title: 'Read connection',
    description:
      'Read one connection configuration, including its subscriptions. Secrets are masked. ' +
      'Use list_connections first if you only know the connection name.',
    inputSchema: z.object({ connectionId: z.string().describe('Connection id from list_connections') }),
    execute: async ({ connectionId }) => {
      const record = await deps.services.connectionService.get(connectionId)
      if (!record) throw new Error(`Connection ${connectionId} not found`)
      return sanitizeConnection(record, isConnected(deps, record.id))
    },
  }),

  open_connection: tool({
    title: 'Open connection',
    description:
      'Open a connection in the MQTTX window without connecting it. Use it to show the user a connection you are about to work on.',
    inputSchema: z.object({ connectionId: z.string() }),
    execute: async ({ connectionId }) => {
      await deps.bridge.open(connectionId)
      return { opened: true }
    },
  }),

  create_connection: tool({
    title: 'Create connection',
    description:
      'Create a new MQTT connection configuration and open it in MQTTX. The connection is not connected; call connect afterwards. ' +
      'If the name already exists, a number is appended.',
    inputSchema: z.object(connectionFields),
    execute: async (input) => {
      assertNotEditing(deps)
      const protocol = input.protocol ?? 'mqtt'
      const existing = (await deps.services.connectionService.getAll()) ?? []
      const record: ConnectionModel = {
        ...getDefaultRecord(),
        ...input,
        protocol,
        port: input.port ?? DEFAULT_PORTS[protocol],
        ssl: protocol === 'mqtts' || protocol === 'wss',
        name: uniqueName(input.name, new Set(existing.map((connection) => connection.name))),
        createAt: now(),
        updateAt: now(),
      }
      const created = await deps.services.connectionService.create(record)
      if (!created?.id) throw new Error('The connection could not be created')
      await deps.bridge.open(created.id)
      return { connectionId: created.id, name: created.name }
    },
  }),

  update_connection: tool({
    title: 'Update connection',
    description:
      'Update an existing connection configuration. Changes to a connected connection take effect the next time it connects. ' +
      'The user must not be editing the connection.',
    inputSchema: z.object({
      connectionId: z.string(),
      changes: z.object(connectionFields).partial(),
    }),
    execute: async ({ connectionId, changes }) => {
      assertNotEditing(deps)
      const current = await deps.services.connectionService.get(connectionId)
      if (!current) throw new Error(`Connection ${connectionId} not found`)
      const protocol = changes.protocol ?? current.protocol
      const updated = await deps.services.connectionService.update(connectionId, {
        ...current,
        ...changes,
        protocol,
        port: changes.port ?? (changes.protocol ? DEFAULT_PORTS[protocol as keyof typeof DEFAULT_PORTS] : current.port),
        ssl: protocol === 'mqtts' || protocol === 'wss',
        updateAt: now(),
      })
      if (!updated) throw new Error(`Connection ${connectionId} could not be updated`)
      // The open page and the list still show the old record until they reload
      await deps.bridge.current()?.reload()
      return { connectionId, reconnectRequired: isConnected(deps, connectionId) }
    },
  }),

  delete_connection: tool({
    title: 'Delete connection',
    description:
      'Disconnect and permanently delete a connection. Ask the user to confirm the target before calling this.',
    inputSchema: z.object({ connectionId: z.string() }),
    execute: async ({ connectionId }) => {
      const view = await deps.bridge.open(connectionId)
      const name = view.record.name
      if (view.getClient().connected) {
        view.disconnect()
        await waitFor(() => !view.getClient().connected, 10000)
      }
      await view.deleteConnection()
      await deps.router.push('/recent_connections')
      return { deleted: true, name }
    },
  }),

  connect: tool({
    title: 'Connect',
    description: 'Connect a configured connection to its broker.',
    inputSchema: z.object({
      connectionId: z.string(),
      timeoutSeconds: z.number().int().min(1).max(60).optional().describe('Connection timeout, default 15 seconds'),
    }),
    execute: async ({ connectionId, timeoutSeconds }) => {
      const view = await deps.bridge.open(connectionId)
      if (view.getClient().connected) {
        return { connected: true, responseInformation: responseInformation(deps, connectionId) }
      }
      await deps.bridge.connect(view, (timeoutSeconds ?? 15) * 1000)
      return { connected: true, responseInformation: responseInformation(deps, connectionId) }
    },
  }),

  disconnect: tool({
    title: 'Disconnect',
    description: 'Disconnect a connection from its broker.',
    inputSchema: z.object({ connectionId: z.string() }),
    execute: async ({ connectionId }) => {
      const view = await deps.bridge.open(connectionId)
      if (!view.getClient().connected) return { disconnected: true }
      view.disconnect()
      await waitFor(() => !view.getClient().connected, 10000)
      return { disconnected: true }
    },
  }),
})

const responseInformation = (deps: AgentToolDeps, id: string): string | undefined =>
  deps.store.getters.activeConnection?.[id]?.responseInformation || undefined

export const waitFor = async (predicate: () => boolean, timeoutMs: number): Promise<void> => {
  const startedAt = Date.now()
  while (!predicate()) {
    if (Date.now() - startedAt >= timeoutMs) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}
