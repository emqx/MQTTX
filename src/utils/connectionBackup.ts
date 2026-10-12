export type CollectionBackup = Pick<CollectionModel, 'id' | 'name' | 'isCollection' | 'orderId'> & {
  parentId: string | null
}
export type ConnectionBackupRecord = CollectionBackup | ConnectionModel

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
/** Record an optional ID, rejecting malformed IDs and IDs already seen for the same record type. */
const claimId = (seen: Set<string>, id: unknown, label: string) => {
  if (id === undefined) return
  if (!isId(id) || seen.has(id)) throw new Error(`Invalid or duplicate ${label}`)
  seen.add(id)
}

/** Validate both legacy connection arrays and JSON arrays containing flat collection records. */
export function readConnectionBackup(data: unknown): {
  collections: CollectionBackup[]
  connections: ConnectionModel[]
} {
  if (!Array.isArray(data) || !data.length) throw new Error('Backup must be a nonempty array')
  const collections: CollectionBackup[] = []
  const connections: ConnectionModel[] = []
  const ids = new Set<string>()
  const childIds = { messages: new Set<string>(), subscriptions: new Set<string>(), will: new Set<string>() }

  for (const record of data) {
    if (!isObject(record) || !isId(record.name)) throw new Error('Invalid backup record')
    if ('parent' in record || 'children' in record || 'connections' in record)
      throw new Error('Invalid backup relations')
    claimId(ids, record.id, 'backup ID')
    if (record.parentId != null && !isId(record.parentId)) throw new Error('Invalid parent ID')
    if (record.orderId != null && !Number.isInteger(record.orderId)) throw new Error('Invalid order ID')
    if (record.isCollection === true) {
      if (!isId(record.id)) throw new Error('Collection ID is required')
      collections.push(record as CollectionBackup)
      continue
    }
    if (record.isCollection !== undefined && record.isCollection !== false) throw new Error('Invalid record type')
    if (
      !isId(record.clientId) ||
      !isId(record.host) ||
      !Number.isInteger(record.port) ||
      record.port < 1 ||
      record.port > 65535
    ) {
      throw new Error('Invalid connection settings')
    }
    if ((record.ssl && !record.certType) || (record.certType === 'self' && !record.ca)) {
      throw new Error('Invalid connection certificate settings')
    }
    for (const key of ['messages', 'subscriptions'] as const) {
      if (record[key] !== undefined && !Array.isArray(record[key])) throw new Error(`Invalid ${key}`)
      for (const child of record[key] ?? []) {
        if (!isObject(child) || typeof child.topic !== 'string') throw new Error(`Invalid ${key} record`)
        if ('connection' in child) throw new Error(`Invalid ${key} relation`)
        if (child.properties != null && !isObject(child.properties)) throw new Error('Invalid MQTT properties')
        claimId(childIds[key], child.id, `${key} ID`)
      }
    }
    if (record.will != null) {
      if (!isObject(record.will)) throw new Error('Invalid will')
      if ('connection' in record.will) throw new Error('Invalid will relation')
      claimId(childIds.will, record.will.id, 'will ID')
    }
    for (const properties of [record.properties, record.will?.properties]) {
      if (properties != null && !isObject(properties)) throw new Error('Invalid MQTT properties')
    }
    connections.push(record as ConnectionModel)
  }

  // Order parents before children without recursion, and reject incomplete or cyclic trees.
  const byId = new Map(collections.map((collection) => [collection.id, collection]))
  const children = new Map<string, CollectionBackup[]>()
  const ordered = collections.filter((collection) => !collection.parentId)
  for (const collection of collections) {
    if (!collection.parentId) continue
    if (!byId.has(collection.parentId)) throw new Error('Missing collection parent')
    const siblings = children.get(collection.parentId) ?? []
    siblings.push(collection)
    children.set(collection.parentId, siblings)
  }
  // Breadth-first: children appended here are visited later in the same loop.
  for (let index = 0; index < ordered.length; index++) {
    const descendants = children.get(ordered[index].id)
    if (descendants) ordered.push(...descendants)
  }
  if (ordered.length !== collections.length) throw new Error('Cyclic collection hierarchy')
  if (collections.length && connections.some((connection) => connection.parentId && !byId.has(connection.parentId))) {
    throw new Error('Missing connection parent')
  }
  // Legacy backups contain no collection entities, so their dangling parent IDs recover at the root.
  return {
    collections: ordered,
    connections: connections.map((connection) => ({
      ...connection,
      parentId: collections.length ? connection.parentId ?? null : null,
    })),
  }
}
