import {
  BatchLimits,
  BatchPacket,
  BatchCarrier,
  DEFAULT_BATCH_LIMITS,
  calculatePublishSize,
  buildTopicCarrier,
  encodeBatchPayload,
  validLogicalTopic,
} from './batchPublishing'
import { BatchStorageMode } from './data'
import { batchPayloadTypeOptions, encodePayloadByType, validatePayloadByType } from './payloadEncoder'

export const BATCH_PREVIEW_ITEMS = 5

export const BATCH_SUMMARY_ITEMS = 20

export const BATCH_SUMMARY_BYTES = 32

export const BATCH_PAGE_SIZE = 100

export type StoredBatchItem = string | { b64: string }

export interface BatchItemDisplay {
  text: string
  title: string
  bytes: number
  binary: boolean
}

const BATCH_BINARY_PREVIEW_BYTES = 6

/** Present stored binary items without exposing their persistence wrapper. */
export const getBatchItemDisplay = (item: StoredBatchItem): BatchItemDisplay => {
  if (typeof item === 'string') {
    return { text: item, title: item, bytes: Buffer.byteLength(item), binary: false }
  }
  const bytes = Buffer.from(item.b64, 'base64')
  return {
    text:
      bytes.subarray(0, BATCH_BINARY_PREVIEW_BYTES).toString('hex') +
      (bytes.length > BATCH_BINARY_PREVIEW_BYTES ? '…' : ''),
    title: bytes.toString('hex'),
    bytes: bytes.length,
    binary: bytes.length > 0,
  }
}

/** Map the connection's displayed MQTT version to its protocol number. */
export const getBatchProtocolVersion = (version?: string): 3 | 4 | 5 => {
  if (version === '5.0') return 5
  if (version === '3.1') return 3
  return 4
}

/** Return effective limits for connections and older settings. */
export const getBatchLimits = (maxItems?: number, maxBytes?: number): typeof DEFAULT_BATCH_LIMITS => ({
  maxItems: maxItems || DEFAULT_BATCH_LIMITS.maxItems,
  maxBytes: maxBytes || DEFAULT_BATCH_LIMITS.maxBytes,
})

/** Derive presentation status from connection facts, without persisting translations. */
export const getBatchNegotiationStatus = (version: string, requested?: boolean, selected?: boolean): string => {
  if (version !== '5.0') return 'batchNotApplicable'
  if (selected) return 'batchSelected'
  if (requested) return 'batchNotSelected'
  return 'batchNotRequested'
}

/** Same newline rules as CLI --file-read: preserve empty lines, drop one final separator. */
export const splitBatchLines = (text: string): string[] => {
  if (text === '') return []
  const lines = text.split(/\r?\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

interface BatchInput {
  count: number
  bytes: number
  items?: Buffer[]
  line?: number
  error?: string
}

/** Encode each editor line once and retain the first failing line. */
export const inspectBatchLines = (text: string, type: PayloadType): BatchInput => {
  const lines = splitBatchLines(text)
  const items: Buffer[] = []
  let bytes = lines.length * 2
  for (let index = 0; index < lines.length; index++) {
    try {
      if (type === 'Hex' || type === 'Base64') {
        const error = validatePayloadByType(lines[index], type)
        if (error) throw new Error(error)
      }
      const encoded = lines[index] === '' ? Buffer.alloc(0) : encodePayloadByType(lines[index], type)
      const item = Buffer.isBuffer(encoded) ? encoded : Buffer.from(encoded)
      items.push(item)
      bytes += item.length
    } catch (error) {
      return { count: lines.length, bytes, line: index + 1, error: (error as Error).message }
    }
  }
  return { count: lines.length, bytes, items }
}

/** Rebuild sent items from editor text; older history used Plaintext implicitly. */
export const getPublishedBatchItems = (text: string, type: PayloadType = 'Plaintext'): StoredBatchItem[] => {
  const { items = [] } = inspectBatchLines(text, type)
  return items.map((item) => {
    if (type === 'Hex' || type === 'Base64') return { b64: item.toString('base64') }
    return item.toString()
  })
}

/** Reused by the publish status and every timed-send iteration. */
export const prepareBatchPublish = (
  message: { topic: string; payload: string; qos: number; retain: boolean },
  type: PayloadType,
  version: number,
  properties: BatchPacket['properties'],
  limits: BatchLimits,
  maximumPacketSize?: number,
  input: BatchInput = inspectBatchLines(message.payload, type),
): BatchInput & { packet?: BatchPacket; carrier?: BatchCarrier } => {
  const fail = (error: string) => ({ ...input, error, packet: undefined })
  if (version === 3) return fail('BATCH_MQTT_VERSION')
  if (message.qos === 2) return fail('UNSUPPORTED_BATCH_QOS')
  if (message.topic === '$batch' || message.topic.startsWith('$batch/')) return fail('BATCH_LOGICAL_TOPIC')
  if (!validLogicalTopic(message.topic)) return fail('INVALID_BATCH_TOPIC')
  if (
    properties?.userProperties &&
    ['batch-format', 'batch-size'].some((key) => Object.prototype.hasOwnProperty.call(properties.userProperties, key))
  )
    return fail('INVALID_BATCH_MARKERS')
  if (properties?.payloadFormatIndicator || (version === 4 && message.retain)) return fail('INVALID_BATCH_METADATA')
  if (!batchPayloadTypeOptions.includes(type)) return fail('BATCH_PAYLOAD_TYPE')
  if (input.error) return fail('BATCH_LINE_ERROR')
  try {
    const payload = encodeBatchPayload(input.items!, limits)
    const packet: BatchPacket = {
      topic: version === 5 ? message.topic : buildTopicCarrier(input.count, message.topic),
      qos: message.qos,
      retain: message.retain,
      payload,
      properties:
        version === 5
          ? {
              ...properties,
              userProperties: {
                ...properties?.userProperties,
                'batch-format': 'v1',
                'batch-size': String(input.count),
              },
            }
          : undefined,
    }
    const packetBytes = calculatePublishSize(packet, version)
    if (maximumPacketSize !== undefined && packetBytes > maximumPacketSize) {
      return fail('BATCH_PACKET_TOO_LARGE')
    }
    return { ...input, packet, carrier: version === 5 ? 'property' : 'topic' }
  } catch (error) {
    return fail((error as Error).message)
  }
}

/** Publish-only diagnostics; received protocol error codes stay verbatim. */
export const formatBatchPublishError = (
  input: BatchInput,
  limits: BatchLimits,
  maximumPacketSize: number | undefined,
  translate: (key: string, values?: Record<string, number | undefined>) => string,
): string => {
  if (input.error === 'BATCH_LIMIT_EXCEEDED') {
    if (input.count > (limits.maxItems ?? 65535)) {
      return translate('connections.batchItemsLimit', { count: input.count, max: limits.maxItems ?? 65535 })
    }
    if (input.bytes > (limits.maxBytes ?? 268435455)) {
      return translate('connections.batchBytesLimit', { bytes: input.bytes, max: limits.maxBytes ?? 268435455 })
    }
    const max = Math.min(limits.maxItemBytes ?? 65535, 65535)
    const index = input.items!.findIndex((item) => item.length > max)
    return translate('connections.batchItemBytesLimit', { line: index + 1, bytes: input.items![index].length, max })
  }
  const keys: Record<string, string> = {
    BATCH_PAYLOAD_TYPE: 'batchPayloadType',
    BATCH_MQTT_VERSION: 'batchMqttVersion',
    BATCH_LINE_ERROR: 'batchLineError',
    BATCH_LOGICAL_TOPIC: 'batchLogicalTopic',
    BATCH_PACKET_TOO_LARGE: 'batchPacketTooLarge',
    INVALID_BATCH_TOPIC: 'batchInvalidTopic',
    INVALID_BATCH_MARKERS: 'batchMarkerConflict',
    INVALID_BATCH_METADATA: 'batchInvalidMetadata',
    UNSUPPORTED_BATCH_QOS: 'batchUnsupportedQos',
  }
  return input.error && keys[input.error]
    ? translate(`connections.${keys[input.error]}`, { line: input.line, max: maximumPacketSize })
    : input.error || ''
}

const isValidUtf8 = (item: Buffer): boolean => Buffer.from(item.toString('utf8')).equals(item)

/** Slice before encoding so even failed, oversized packets have a bounded stored preview. */
export const batchHexPreview = (payload: Buffer, maxDisplaySize: number): string =>
  payload.subarray(0, Math.max(0, Math.floor(maxDisplaySize / 2))).toString('hex')

/** Convert validated slices, bounding summaries before decoding text. */
export const storeBatchItems = (
  items: Buffer[],
  mode: BatchStorageMode,
  type: PayloadType,
  convert: (item: Buffer) => string,
): StoredBatchItem[] =>
  (mode === 'summary' ? items.slice(0, BATCH_SUMMARY_ITEMS) : items).map((item) => {
    const utf8 = type !== 'Hex' && type !== 'Base64' && isValidUtf8(item)
    const binary = type === 'Plaintext' && !utf8
    let prefix = mode === 'summary' ? item.subarray(0, BATCH_SUMMARY_BYTES) : item
    if (utf8 && prefix.length < item.length) {
      // A partial final UTF-8 code point is omitted, never replaced with U+FFFD.
      while (prefix.length && !isValidUtf8(prefix)) prefix = prefix.subarray(0, prefix.length - 1)
    }
    if (binary) return { b64: prefix.toString('base64') }
    let text: string
    try {
      text = convert(prefix)
    } catch (error) {
      text = prefix.toString()
    }
    return text + (mode === 'summary' && item.length > prefix.length ? '…' : '')
  })
