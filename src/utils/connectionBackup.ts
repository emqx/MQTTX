export type CollectionBackup = Pick<CollectionModel, 'id' | 'name' | 'isCollection' | 'orderId'> & {
  parentId: string | null
}
export type ConnectionBackupRecord = CollectionBackup | ConnectionModel

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

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
    if (record.id !== undefined) {
      if (!isId(record.id) || ids.has(record.id)) throw new Error('Invalid or duplicate backup ID')
      ids.add(record.id)
    }
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
        if (child.id !== undefined) {
          if (!isId(child.id) || childIds[key].has(child.id)) throw new Error(`Invalid or duplicate ${key} ID`)
          childIds[key].add(child.id)
        }
      }
    }
    if (record.will != null) {
      if (!isObject(record.will)) throw new Error('Invalid will')
      if ('connection' in record.will) throw new Error('Invalid will relation')
      if (record.will.id !== undefined) {
        if (!isId(record.will.id) || childIds.will.has(record.will.id)) throw new Error('Invalid or duplicate will ID')
        childIds.will.add(record.will.id)
      }
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
  for (let index = 0; index < ordered.length; index++) ordered.push(...(children.get(ordered[index].id) ?? []))
  if (ordered.length !== collections.length) throw new Error('Cyclic collection hierarchy')
  if (collections.length && connections.some((connection) => connection.parentId && !byId.has(connection.parentId))) {
    throw new Error('Missing connection parent')
  }
  return { collections: ordered, connections }
}
