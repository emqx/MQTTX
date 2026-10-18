import { z } from 'zod/v4'
import { tool, ToolSet } from 'ai'
import { getDefaultRecord } from '@/utils/mqttUtils'
import { AgentToolDeps } from './types'
import { assertReadableFile, now, sanitizeConnection } from './helpers'
import { findGroup } from './groups'
import { emitAgentDataChanged } from '../agentEvents'

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
  groupId: z
    .string()
    .nullable()
    .optional()
    .describe('Move the connection into this group; null moves it to the top level'),
  certType: z
    .enum(['server', 'self'])
    .optional()
    .describe("'server' trusts the system CA; 'self' uses the ca/cert/key files"),
  ca: z.string().optional().describe('Absolute path of the CA certificate file (certType self)'),
  cert: z.string().optional().describe('Absolute path of the client certificate file (certType self)'),
  key: z.string().optional().describe('Absolute path of the client private key file (certType self)'),
  ALPNProtocols: z.array(z.string()).optional().describe("ALPN protocol names, for example ['mqtt']"),
}

const TLS_FIELDS = ['certType', 'ca', 'cert', 'key', 'ALPNProtocols'] as const
const TLS_PROTOCOLS: string[] = ['mqtts', 'wss']

interface TlsFields {
  protocol?: string
  certType?: string
  ca?: string
  cert?: string
  key?: string
  ALPNProtocols?: string | string[] | null
}

interface NormalizedTls {
  certType?: CertType
  ca?: string
  cert?: string
  key?: string
  ALPNProtocols?: string
}

const hasTlsValue = (value: unknown): boolean =>
  value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)

const providedTlsFields = (fields: TlsFields): string[] => TLS_FIELDS.filter((key) => hasTlsValue(fields[key]))

type TlsFieldKey = typeof TLS_FIELDS[number]

/** Everything except the TLS fields, so the normalized values are the only ones written */
const omitTlsFields = <T extends Record<string, unknown>>(fields: T): Omit<T, TlsFieldKey> => {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (!(TLS_FIELDS as readonly string[]).includes(key)) result[key] = value
  }
  return result as Omit<T, TlsFieldKey>
}

/** Validates the TLS settings of a connection; returns the fields to store, or {} when none were given */
const normalizeTls = (fields: TlsFields, provided: string[]): NormalizedTls => {
  if (!provided.length) return {}
  if (!TLS_PROTOCOLS.includes(fields.protocol ?? '')) {
    throw new Error(
      `TLS settings (${provided.join(', ')}) need the protocol "mqtts" or "wss", but the protocol is "${
        fields.protocol
      }". Set the protocol first.`,
    )
  }
  const ca = typeof fields.ca === 'string' ? fields.ca.trim() : ''
  const cert = typeof fields.cert === 'string' ? fields.cert.trim() : ''
  const key = typeof fields.key === 'string' ? fields.key.trim() : ''
  if (Boolean(cert) !== Boolean(key)) {
    throw new Error('Provide both "cert" and "key", or neither of them.')
  }
  if (ca) assertReadableFile('TLS ca', ca)
  if (cert) assertReadableFile('TLS cert', cert)
  if (key) assertReadableFile('TLS key', key)
  let certType: CertType | undefined =
    fields.certType === 'server' || fields.certType === 'self' ? fields.certType : undefined
  if (!certType && (ca || cert || key)) certType = 'self'
  const alpn = Array.isArray(fields.ALPNProtocols) ? fields.ALPNProtocols.join(',') : fields.ALPNProtocols
  return { certType, ca, cert, key, ALPNProtocols: typeof alpn === 'string' ? alpn : '' }
}

const isTlsProtocol = (protocol: string | undefined): boolean => TLS_PROTOCOLS.includes(protocol ?? '')

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
      const [connections = [], collections = []] = await Promise.all([
        deps.services.connectionService.getAll(),
        deps.services.collectionService.getAll(),
      ])
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
          groupId: connection.parentId ?? null,
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
      const view = deps.bridge.current()
      const timedPublishing = Boolean(view && view.connectionId === connectionId && view.isTimedPublishing())
      return { ...sanitizeConnection(record, isConnected(deps, record.id)), timedPublishing }
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
      const { certType, ca, cert, key, ALPNProtocols, groupId, ...rest } = input
      if (groupId) {
        const groups = (await deps.services.collectionService.getAll()) ?? []
        if (!findGroup(groups, groupId)) throw new Error(`Group ${groupId} not found`)
      }
      const tls = normalizeTls({ protocol, certType, ca, cert, key, ALPNProtocols }, providedTlsFields(input))
      const existing = (await deps.services.connectionService.getAll()) ?? []
      const record: ConnectionModel = {
        ...getDefaultRecord(),
        ...rest,
        ...tls,
        protocol,
        port: input.port ?? DEFAULT_PORTS[protocol],
        ssl: isTlsProtocol(protocol),
        name: uniqueName(input.name, new Set(existing.map((connection) => connection.name))),
        // ConnectionService stores the group as parentId; the model keeps no groupId field
        parentId: groupId ?? null,
        createAt: now(),
        updateAt: now(),
      }
      const created = await deps.services.connectionService.create(record)
      if (!created?.id) throw new Error('The connection could not be created')
      await deps.bridge.open(created.id)
      emitAgentDataChanged('connections')
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
      const merged = { ...current, ...changes }
      const protocol = merged.protocol ?? current.protocol
      const { groupId, ...recordChanges } = omitTlsFields(changes)
      const tls = normalizeTls(
        {
          protocol,
          certType: merged.certType,
          ca: merged.ca,
          cert: merged.cert,
          key: merged.key,
          ALPNProtocols: merged.ALPNProtocols,
        },
        providedTlsFields(changes),
      )
      const updated = await deps.services.connectionService.update(connectionId, {
        ...current,
        ...recordChanges,
        ...tls,
        protocol,
        port: changes.port ?? (changes.protocol ? DEFAULT_PORTS[protocol as keyof typeof DEFAULT_PORTS] : current.port),
        ssl: isTlsProtocol(protocol),
        updateAt: now(),
      })
      if (!updated) throw new Error(`Connection ${connectionId} could not be updated`)
      if (groupId !== undefined) {
        await deps.services.connectionService.updateCollectionId(connectionId, groupId ?? null)
        emitAgentDataChanged('connections')
      }
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
