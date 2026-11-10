/** MQTT Batch Publishing v1, spec §§2.1, 3 and 4. No MQTT runtime dependency. */
type UserProperties = Record<string, string | string[]>
export interface PublishProperties {
  payloadFormatIndicator?: boolean | number
  messageExpiryInterval?: number
  topicAlias?: number
  responseTopic?: string
  correlationData?: string | Buffer
  userProperties?: UserProperties
  subscriptionIdentifier?: number | number[]
  contentType?: string
}
export interface BatchPacket {
  topic: string
  payload: Buffer
  qos?: number
  retain?: boolean
  properties?: PublishProperties
}
export interface BatchLimits {
  maxItems?: number
  maxBytes?: number
  maxItemBytes?: number
}
export const DEFAULT_BATCH_LIMITS = { maxItems: 100, maxBytes: 65536 }
export const PROTOCOL_BATCH_LIMITS = { maxItems: 65535, maxBytes: 268435455 }
type BatchCarrier = 'property' | 'topic'
interface BatchMetadata {
  carrier: BatchCarrier
  logicalTopic: string
  count: number
}
type BatchResult =
  | (BatchMetadata & { items: Buffer[]; error?: undefined })
  | { carrier: BatchCarrier; logicalTopic: string; count?: number; error: string; items?: undefined }

const reject = (code: string): never => {
  throw new Error(code)
}

export const parseBatchCount = (text: string): number => {
  if (!/^[1-9][0-9]{0,4}$/.test(text) || String(Number(text)) !== text || Number(text) > 65535) {
    return reject('INVALID_BATCH_COUNT')
  }
  return Number(text)
}

export const validLogicalTopic = (topic: string) =>
  topic.length > 0 &&
  !topic.startsWith('$') &&
  !/[\u0000#+]/.test(topic) &&
  Buffer.byteLength(topic) <= 65535 &&
  Buffer.from(topic).toString() === topic

// Count validation follows metadata validation in §4.1, so parsing keeps the raw count.
export const parseTopicCarrier = (topic: string) => {
  const separator = topic.indexOf('/', 7)
  const logicalTopic = topic.slice(separator + 1)
  if (
    !topic.startsWith('$batch/') ||
    separator < 0 ||
    !validLogicalTopic(logicalTopic) ||
    Buffer.byteLength(topic) > 65535
  ) {
    return reject('INVALID_BATCH_TOPIC')
  }
  return { countText: topic.slice(7, separator), logicalTopic }
}

export const buildTopicCarrier = (count: number, topic: string): string => {
  parseBatchCount(String(count))
  const wireTopic = `$batch/${count}/${topic}`
  parseTopicCarrier(wireTopic)
  return wireTopic
}

const values = (properties: UserProperties | undefined, key: string): string[] => {
  const value = properties?.[key]
  return value === undefined ? [] : typeof value === 'string' ? [value] : value
}
export const hasMarker = (properties?: UserProperties) =>
  properties !== undefined &&
  (Object.prototype.hasOwnProperty.call(properties, 'batch-format') ||
    Object.prototype.hasOwnProperty.call(properties, 'batch-size'))

export const classifyBatch = (packet: BatchPacket, mqttVersion: number): BatchCarrier | undefined => {
  if (packet.topic === '$batch' || packet.topic.startsWith('$batch/')) return 'topic'
  if (mqttVersion === 5 && hasMarker(packet.properties?.userProperties)) return 'property'
  return undefined
}

const validateBatchMetadata = (packet: BatchPacket, carrier: BatchCarrier): BatchMetadata => {
  if (packet.qos === 2) return reject('UNSUPPORTED_BATCH_QOS')
  const properties = packet.properties
  const userProperties = properties?.userProperties
  let logicalTopic = packet.topic
  let countText: string
  let format = 'v1'
  if (carrier === 'topic') {
    const parsed = parseTopicCarrier(packet.topic)
    logicalTopic = parsed.logicalTopic
    countText = parsed.countText
  } else {
    const formats = values(userProperties, 'batch-format')
    const counts = values(userProperties, 'batch-size')
    if (formats.length !== 1 || counts.length !== 1) return reject('INVALID_BATCH_MARKERS')
    format = formats[0]
    countText = counts[0]
  }
  if (format !== 'v1') return reject('UNSUPPORTED_BATCH_FORMAT')
  if (
    (properties?.payloadFormatIndicator !== undefined &&
      properties.payloadFormatIndicator !== false &&
      properties.payloadFormatIndicator !== 0) ||
    (carrier === 'topic' && (packet.retain || hasMarker(userProperties)))
  )
    return reject('INVALID_BATCH_METADATA')
  return { carrier, logicalTopic, count: parseBatchCount(countText) }
}

export const encodeBatchPayload = (items: readonly Buffer[], limits: BatchLimits = DEFAULT_BATCH_LIMITS): Buffer => {
  parseBatchCount(String(items.length))
  const bytes = items.reduce((total, item) => total + 2 + item.length, 0)
  if (
    items.length > (limits.maxItems ?? PROTOCOL_BATCH_LIMITS.maxItems) ||
    bytes > (limits.maxBytes ?? PROTOCOL_BATCH_LIMITS.maxBytes) ||
    items.some((item) => item.length > Math.min(limits.maxItemBytes ?? 65535, 65535))
  ) {
    return reject('BATCH_LIMIT_EXCEEDED')
  }
  const payload = Buffer.allocUnsafe(bytes)
  let offset = 0
  items.forEach((item) => {
    payload.writeUInt16BE(item.length, offset)
    item.copy(payload, offset + 2)
    offset += 2 + item.length
  })
  return payload
}

const decodeBatchPayload = (payload: Buffer, count: number, limits: BatchLimits = DEFAULT_BATCH_LIMITS): Buffer[] => {
  if (
    count > (limits.maxItems ?? PROTOCOL_BATCH_LIMITS.maxItems) ||
    payload.length > (limits.maxBytes ?? PROTOCOL_BATCH_LIMITS.maxBytes)
  ) {
    return reject('BATCH_LIMIT_EXCEEDED')
  }
  if (count > Math.floor(payload.length / 2)) return reject('BATCH_COUNT_MISMATCH')
  const items: Buffer[] = []
  let offset = 0
  for (let index = 0; index < count; index++) {
    const remaining = payload.length - offset
    if (remaining === 0) return reject('BATCH_COUNT_MISMATCH')
    if (remaining === 1) return reject('INVALID_ITEM_LENGTH')
    const length = payload.readUInt16BE(offset)
    offset += 2
    if (length > payload.length - offset) return reject('TRUNCATED_ITEM')
    if (length > (limits.maxItemBytes ?? 65535)) return reject('BATCH_LIMIT_EXCEEDED')
    items.push(payload.subarray(offset, offset + length))
    offset += length
  }
  if (offset !== payload.length) return reject('BATCH_COUNT_MISMATCH')
  return items
}

export const decodeBatch = (
  packet: BatchPacket,
  mqttVersion: number,
  limits: BatchLimits = DEFAULT_BATCH_LIMITS,
): BatchResult | undefined => {
  const carrier = classifyBatch(packet, mqttVersion)
  if (!carrier) return undefined
  let metadata: BatchMetadata | undefined
  try {
    metadata = validateBatchMetadata(packet, carrier)
    return { ...metadata, items: decodeBatchPayload(packet.payload, metadata.count, limits) }
  } catch (error) {
    return {
      carrier,
      logicalTopic: metadata?.logicalTopic ?? packet.topic,
      count: metadata?.count,
      error: (error as Error).message,
    }
  }
}

/** Complete PUBLISH size: fixed header, VBI widths, variable header, properties and payload. */
const vbiBytes = (value: number): number => {
  if (!Number.isInteger(value) || value < 0 || value > 268435455)
    return reject('PUBLISH exceeds MQTT packet size limit.')
  return value < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : 4
}
const stringBytes = (value: string | Buffer) => 2 + Buffer.byteLength(value)
export const calculatePublishSize = (packet: BatchPacket, mqttVersion: number): number => {
  let remaining = stringBytes(packet.topic) + (packet.qos ? 2 : 0) + packet.payload.length
  if (mqttVersion === 5) {
    const p = packet.properties ?? {}
    let bytes = 0
    if (p.payloadFormatIndicator !== undefined) bytes += 2
    if (p.messageExpiryInterval !== undefined) bytes += 5
    if (p.topicAlias !== undefined) bytes += 3
    if (p.responseTopic !== undefined) bytes += 1 + stringBytes(p.responseTopic)
    if (p.correlationData !== undefined) bytes += 1 + stringBytes(p.correlationData)
    if (p.contentType !== undefined) bytes += 1 + stringBytes(p.contentType)
    if (p.subscriptionIdentifier !== undefined) {
      const ids = Array.isArray(p.subscriptionIdentifier) ? p.subscriptionIdentifier : [p.subscriptionIdentifier]
      ids.forEach((id) => {
        bytes += 1 + vbiBytes(id)
      })
    }
    Object.entries(p.userProperties ?? {}).forEach(([key, value]) => {
      const entries = typeof value === 'string' ? [value] : value
      entries.forEach((entry) => {
        bytes += 1 + stringBytes(key) + stringBytes(entry)
      })
    })
    remaining += vbiBytes(bytes) + bytes
  }
  return 1 + vbiBytes(remaining) + remaining
}

export const validateBatchSelection = (
  offer: UserProperties | undefined,
  connack: UserProperties | undefined,
): boolean => {
  const offered = values(offer, 'batch-publish')
  const selected = values(connack, 'batch-publish')
  return offered.length === 1 && offered[0] === 'v1' && selected.length === 1 && selected[0] === 'v1'
}
