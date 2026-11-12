import {
  BatchLimits,
  BatchPacket,
  BatchCarrier,
  calculateBatchPayloadSize,
  calculatePublishSize,
  buildTopicCarrier,
  hasMarker,
  validLogicalTopic,
} from './batchPublishing'
import { BatchStorageMode } from './data'
import {
  batchPayloadTypeOptions,
  decodePayloadByType,
  encodePayloadByType,
  validatePayloadByType,
} from './payloadEncoder'

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

export const getBatchNegotiationStatus = (version: string, requested?: boolean, selected?: boolean): string => {
  if (version !== '5.0') return 'batchNotApplicable'
  if (selected) return 'batchSelected'
  if (requested) return 'batchNotSelected'
  return 'batchNotRequested'
}

// Match CLI --file-read: keep empty lines and drop one trailing newline.
export const splitBatchLines = (text: string): string[] => {
  if (text === '') return []
  const lines = text.split(/\r?\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

export interface BatchInput {
  count: number
  bytes: number
  items?: Buffer[]
  line?: number
  encodingError?: string
  error?: string
}

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

// Published history without a payload type used Plaintext.
export const getPublishedBatchItems = (text: string, type: PayloadType = 'Plaintext'): StoredBatchItem[] => {
  const { items = [] } = inspectBatchLines(text, type)
  return items.map((item) => {
    if (type === 'Hex' || type === 'Base64') return { b64: item.toString('base64') }
    return item.toString()
  })
}

export const prepareBatchPublish = (
  message: { topic: string; payload: string; qos: number; retain: boolean },
  type: PayloadType,
  version: number,
  properties: BatchPacket['properties'],
  limits: BatchLimits,
  maximumPacketSize?: number,
  input: BatchInput = inspectBatchLines(message.payload, type),
): BatchInput & { packet?: Omit<BatchPacket, 'payload'>; carrier?: BatchCarrier } => {
  const fail = (error: string) => ({ ...input, error, packet: undefined })
  if (version === 3) return fail('BATCH_MQTT_VERSION')
  if (message.qos === 2) return fail('UNSUPPORTED_BATCH_QOS')
  if (message.topic === '$batch' || message.topic.startsWith('$batch/')) return fail('BATCH_LOGICAL_TOPIC')
  if (!validLogicalTopic(message.topic)) return fail('INVALID_BATCH_TOPIC')
  if (hasMarker(properties?.userProperties)) return fail('INVALID_BATCH_MARKERS')
  if (properties?.payloadFormatIndicator || (version === 4 && message.retain)) return fail('INVALID_BATCH_METADATA')
  if (!batchPayloadTypeOptions.includes(type)) return fail('BATCH_PAYLOAD_TYPE')
  if (input.error) return { ...fail('BATCH_LINE_ERROR'), encodingError: input.error }
  try {
    calculateBatchPayloadSize(input.items!, limits, input.bytes)
    const packet: Omit<BatchPacket, 'payload'> = {
      topic: version === 5 ? message.topic : buildTopicCarrier(input.count, message.topic),
      qos: message.qos,
      retain: message.retain,
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
    const packetBytes = calculatePublishSize(packet, version, input.bytes)
    if (maximumPacketSize !== undefined && packetBytes > maximumPacketSize) {
      return fail('BATCH_PACKET_TOO_LARGE')
    }
    return { ...input, packet, carrier: version === 5 ? 'property' : 'topic' }
  } catch (error) {
    return fail((error as Error).message)
  }
}

// Keep protocol error codes unchanged on receive.
export const formatBatchPublishError = (
  input: BatchInput,
  limits: BatchLimits,
  maximumPacketSize: number | undefined,
  translate: (key: string, values?: Record<string, string | number | undefined>) => string,
): string => {
  if (input.error === 'BATCH_LINE_ERROR') {
    const reasons: Record<string, string> = {
      'Invalid Hex string': 'batchInvalidHex',
      'Invalid Base64 string': 'batchInvalidBase64',
    }
    const reason = input.encodingError && reasons[input.encodingError]
    return translate('connections.batchLineError', {
      line: input.line,
      reason: reason ? translate(`connections.${reason}`) : input.encodingError,
    })
  }
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

// Slice before hex encoding to bound memory for oversized packets.
export const batchHexPreview = (payload: Buffer, maxDisplaySize: number): string =>
  payload.subarray(0, Math.max(0, Math.floor(maxDisplaySize / 2))).toString('hex')

// Cut summaries before decoding to keep the converted data small.
export const storeBatchItems = (
  items: Buffer[],
  mode: BatchStorageMode,
  type: PayloadType,
): { items: StoredBatchItem[]; conversionFallback: boolean } => {
  let conversionFallback = false
  const stored = (mode === 'summary' ? items.slice(0, BATCH_SUMMARY_ITEMS) : items).map((item) => {
    const utf8 =
      type !== 'Hex' && type !== 'Base64' && (type === 'Plaintext' || mode === 'summary') && isValidUtf8(item)
    const binary = type === 'Plaintext' && !utf8
    let prefix = mode === 'summary' ? item.subarray(0, BATCH_SUMMARY_BYTES) : item
    if (utf8 && prefix.length < item.length) {
      // Drop a partial UTF-8 character at the cut to avoid U+FFFD.
      while (prefix.length && !isValidUtf8(prefix)) prefix = prefix.subarray(0, prefix.length - 1)
    }
    if (binary) return { b64: prefix.toString('base64') }
    let text: string
    try {
      text = String(decodePayloadByType(prefix, type) ?? '')
    } catch (error) {
      conversionFallback = true
      text = prefix.toString()
    }
    return text + (mode === 'summary' && item.length > prefix.length ? '…' : '')
  })
  return { items: stored, conversionFallback }
}
