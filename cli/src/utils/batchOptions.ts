import logWrapper from './logWrapper'
import {
  buildTopicCarrier,
  parseTopicCarrier,
  parseBatchCount,
  validLogicalTopic,
  validateBatchSelection,
} from './batchPublishing'

export const validateBatchOptions = (
  options: PublishOptions | SubscribeOptions,
  command: 'pub' | 'sub' | 'benchPub' | 'benchSub',
): void => {
  const publishing = command === 'pub' || command === 'benchPub'
  const enabled = options.batch
  if (command === 'benchPub' && options.batchItems !== undefined && !enabled) {
    throw new Error('-bi requires -b.')
  }
  const conflict = (reason: string): never => {
    throw new Error(`Batch option conflict: ${reason}`)
  }
  const integer = (value: number | undefined, name: string, min: number, max: number) => {
    if (value !== undefined && (!Number.isInteger(value) || value < min || value > max)) {
      throw new Error(`Invalid --${name}: expected an integer in ${min}..${max}.`)
    }
  }
  integer(options.batchItems, 'batch-items', 1, 65535)
  integer(options.batchMaxItems, 'batch-max-items', 1, 65535)
  integer(options.batchMaxBytes, 'batch-max-bytes', 1024, 1048576)
  if (options.batchNegotiate) {
    if (!publishing || !enabled || options.mqttVersion !== 5)
      conflict('--batch-negotiate requires batch publishing with MQTT 5.0.')
    if (Object.prototype.hasOwnProperty.call(options.connUserProperties ?? {}, 'batch-publish')) {
      conflict('--batch-negotiate cannot be combined with -Cup batch-publish.')
    }
  }
  if (command === 'pub' && (options as PublishOptions).split !== undefined && !enabled) {
    conflict('--split requires -b.')
  }
  if (!enabled) return
  if (options.mqttVersion === 3)
    throw new Error('Batch publishing requires MQTT 5.0 or 3.1.1; MQTT 3.1 is unsupported.')
  const qos = Array.isArray(options.qos) ? options.qos : [options.qos]
  if (qos.includes(2)) conflict('batch requires QoS 0 or 1.')
  if (!publishing) return
  const pub = options as PublishOptions
  if (pub.topic.startsWith('$batch/')) {
    let suggestion = ''
    try {
      const parsed = parseTopicCarrier(pub.topic)
      parseBatchCount(parsed.countText)
      suggestion = ` Try: -t ${parsed.logicalTopic}`
    } catch {
      // Malformed prefixed topics have no valid logical-topic suggestion.
    }
    throw new Error(`With -b, -t takes the logical topic; the $batch/{N}/ prefix is added automatically.${suggestion}`)
  }
  // §3.3 also validates the logical topic and the complete wire-topic byte limit.
  if (!validLogicalTopic(pub.topic)) {
    throw new Error(`Invalid topic for -b: ${pub.topic} (INVALID_BATCH_TOPIC, spec §3.3).`)
  }
  if (options.mqttVersion === 4) buildTopicCarrier(command === 'benchPub' ? options.batchItems ?? 100 : 1, pub.topic)
  if (pub.mqttVersion === 4 && pub.retain) conflict('MQTT 3.1.1 batch publishing requires RETAIN=0.')
  if (pub.payloadFormatIndicator) conflict('batch envelopes require Payload Format Indicator 0 or absent.')
  if (
    ['batch-format', 'batch-size'].some((key) => Object.prototype.hasOwnProperty.call(pub.userProperties ?? {}, key))
  ) {
    conflict('-up batch-format / batch-size are generated automatically.')
  }
  if (pub.protobufPath || pub.protobufMessageName || pub.avscPath)
    conflict('batch does not support per-item Schema encoding.')
  if (command === 'pub') {
    if (pub.stdin || pub.multiline || pub.lineMode) {
      throw new Error(
        '-b reads items from -m or --file-read (one per line). For piped input use --file-read /dev/stdin.',
      )
    }
    if (pub.payloadSize) conflict('-b reads items from -m or --file-read; -S is unsupported.')
    if (pub.split !== undefined && !pub.fileRead) conflict('--split requires --file-read.')
  } else if (pub.split !== undefined) {
    conflict('bench pub -b uses the whole file as one item template; --split is unsupported.')
  }
}

export const checkBatchOptions = (
  options: PublishOptions | SubscribeOptions,
  command: 'pub' | 'sub' | 'benchPub' | 'benchSub',
) => {
  try {
    validateBatchOptions(options, command)
  } catch (error) {
    logWrapper.fail((error as Error).toString())
    process.exit(1)
  }
}

export const addBatchOffer = (options: PublishOptions) => {
  if (options.batchNegotiate) {
    options.connUserProperties = { ...options.connUserProperties, 'batch-publish': 'v1' }
  }
}

/** Session pin lives only in this client/process, per spec §2.1. */
export const createBatchSelectionCheck = (offer?: Record<string, string | string[]>, required = false) => {
  let pinned = false
  return (packet: {
    sessionPresent?: boolean
    properties?: { userProperties?: Record<string, string | string[]> }
  }) => {
    const selected = validateBatchSelection(offer, packet.properties?.userProperties)
    if (pinned && packet.sessionPresent && !selected) {
      throw new Error('Batch session resume failed: v1 capability was not reselected.')
    }
    if (required && !selected) {
      throw new Error('Batch negotiation failed: expected exactly one batch-publish=v1 selection; no batch sent.')
    }
    if (selected) pinned = true
    return selected
  }
}
