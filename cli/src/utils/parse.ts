import * as fs from 'fs'
import logWrapper from './logWrapper'
import { getSpecialTypesOption } from '../utils/generator'
import { processPath } from '../utils/fileUtils'

import { IClientOptions, IClientPublishOptions, IClientSubscribeOptions } from 'mqtt'
import { getLocalScenarioList, getScenarioFilePath } from './simulate'
import {
  MAX_INFLIGHT_LIMIT,
  MQTT_SINGLE_MESSAGE_BYTE_LIMIT,
  DEFAULT_BATCH_ITEMS,
  MAX_BATCH_ITEMS,
  MIN_BATCH_BYTES,
  MAX_BATCH_BYTES,
} from './constants'
import { buildTopicCarrier, hasMarker, parseTopicCarrier, parseBatchCount, validLogicalTopic } from './batchPublishing'

const parseNumber = (value: string) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    logWrapper.fail(`${value} is not a number.`)
    process.exit(1)
  }
  return parsedValue
}

// Benchmark retry counters are stored in arrays, whose maximum length is 2^32 - 1.
const MAX_CLIENT_COUNT = 0xffffffff

const fail = (message: string): never => {
  logWrapper.fail(message)
  process.exit(1)
}

const validateIntegerRange = (value: unknown, name: string, min: number, max: number): void => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    fail(`Invalid ${name}: ${value}. Expected an integer between ${min} and ${max}.`)
  }
}

const validateClientCount = (count: unknown): void => validateIntegerRange(count, 'client count', 1, MAX_CLIENT_COUNT)

const validateMaxInflight = (maxInflight: unknown): void =>
  validateIntegerRange(maxInflight, 'max inflight', 1, MAX_INFLIGHT_LIMIT)

const parseProtocol = (value: string) => {
  if (!['mqtt', 'mqtts', 'ws', 'wss'].includes(value)) {
    logWrapper.fail('Only mqtt, mqtts, ws and wss are supported.')
    process.exit(1)
  }
  return value
}

const parseMQTTVersion = (value: string) => {
  const dict: Record<string, number> = {
    '3.1': 3,
    '3.1.1': 4,
    '5': 5,
  }
  const trimmedValue = value.trim()
  // Normalize '5.0' to '5'
  const normalizedValue = trimmedValue === '5.0' ? '5' : trimmedValue
  if (!dict[normalizedValue]) {
    logWrapper.fail('Not a valid MQTT version.')
    process.exit(1)
  }
  return dict[normalizedValue as '3.1' | '3.1.1' | '5']
}

/** Collect repeated pub messages; the first explicit value replaces the default. */
const parseMessage = (value: string, previous: string | string[]): string | string[] => {
  if (Array.isArray(previous)) {
    previous.push(value)
    return previous
  }
  return [value]
}

/** Validate batch options using the same failure path as other CLI validators. */
const validateBatchOptions = (
  options: PublishOptions | SubscribeOptions | BenchPublishOptions | BenchSubscribeOptions,
  command: 'pub' | 'sub' | 'benchPub' | 'benchSub',
): void => {
  const publishing = command === 'pub' || command === 'benchPub'
  const pub = options as PublishOptions & BenchPublishOptions
  const enabled = options.batch
  if (command === 'benchPub' && pub.batchItems !== undefined && !enabled) {
    fail('-bi requires -b.')
  }
  if (pub.batchItems !== undefined) {
    validateIntegerRange(pub.batchItems, 'batch items', 1, MAX_BATCH_ITEMS)
  }
  if (pub.batchMaxItems !== undefined) {
    validateIntegerRange(pub.batchMaxItems, 'batch max items', 1, MAX_BATCH_ITEMS)
  }
  if (pub.batchMaxBytes !== undefined) {
    validateIntegerRange(pub.batchMaxBytes, 'batch max bytes', MIN_BATCH_BYTES, MAX_BATCH_BYTES)
  }
  if (pub.batchNegotiate) {
    if (!publishing || !enabled || options.mqttVersion !== 5) {
      fail('--batch-negotiate requires batch publishing with MQTT 5.0.')
    }
    if (Object.prototype.hasOwnProperty.call(pub.connUserProperties ?? {}, 'batch-publish')) {
      fail('--batch-negotiate cannot be combined with -Cup batch-publish.')
    }
  }
  if (command === 'pub' && pub.split !== undefined && !enabled) {
    fail('--split requires -b.')
  }
  if (!enabled) return
  if (options.mqttVersion === 3) {
    fail('Batch publishing requires MQTT 5.0 or 3.1.1. MQTT 3.1 is unsupported.')
  }
  const qos = Array.isArray(options.qos) ? options.qos : [options.qos]
  if (qos.includes(2)) {
    fail('Batch publishing requires QoS 0 or 1.')
  }
  if (!publishing) return
  if (pub.topic.startsWith('$batch/')) {
    let suggestion = ''
    try {
      const parsed = parseTopicCarrier(pub.topic)
      parseBatchCount(parsed.countText)
      suggestion = ` Try: -t ${parsed.logicalTopic}`
    } catch {
      // Malformed prefixed topics have no valid logical-topic suggestion.
    }
    fail(`With -b, -t takes the logical topic; the $batch/{N}/ prefix is added automatically.${suggestion}`)
  }
  if (!validLogicalTopic(pub.topic)) {
    fail(`Invalid topic for -b: ${pub.topic} (INVALID_BATCH_TOPIC).`)
  }
  if (options.mqttVersion === 4) {
    try {
      const count = command === 'benchPub' ? pub.batchItems ?? DEFAULT_BATCH_ITEMS : 1
      buildTopicCarrier(count, pub.topic)
    } catch {
      fail(`Invalid topic for -b: ${pub.topic}. The batch topic exceeds the MQTT topic byte limit.`)
    }
  }
  if (pub.mqttVersion === 4 && pub.retain) {
    fail('MQTT 3.1.1 batch publishing requires RETAIN=0.')
  }
  if (pub.payloadFormatIndicator) {
    fail('Batch envelopes require Payload Format Indicator 0 or absent.')
  }
  if (hasMarker(pub.userProperties)) {
    fail('-up batch-format and batch-size are generated automatically with -b.')
  }
  if (pub.protobufPath || pub.protobufMessageName || pub.avscPath) {
    fail('Batch publishing does not support per-item schema encoding.')
  }
  if (command === 'pub') {
    if (pub.stdin || pub.multiline || pub.lineMode) {
      fail('-b reads items from -m or --file-read (one per line). For piped input use --file-read /dev/stdin.')
    }
    if (pub.payloadSize) {
      fail('-b reads items from -m or --file-read. -S is unsupported.')
    }
    if (pub.split !== undefined && !pub.fileRead) {
      fail('--split requires --file-read.')
    }
  } else if (pub.split !== undefined) {
    fail('bench pub -b uses the whole file as one item template. --split is unsupported.')
  }
}

const parseKeyValues = (value: string, previous?: Record<string, string | string[]>) => {
  const [key, val] = value.split(': ')
  if (key && val) {
    if (!previous) {
      return { [key]: val }
    } else {
      if (previous[key]) {
        if (Array.isArray(previous[key])) {
          ;(previous[key] as string[]).push(val)
        } else {
          previous[key] = [previous[key] as string, val]
        }
        return previous
      } else {
        return { ...previous, [key]: val }
      }
    }
  } else {
    logWrapper.fail(`Invalid key-value pair: "${value}". Expected format is "key: value".`)
    process.exit(1)
  }
}

const parseQoSValue = (value: unknown): QoS => {
  const parsedValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (parsedValue === 0 || parsedValue === 1 || parsedValue === 2) return parsedValue

  const label = typeof value === 'string' || typeof value === 'number' ? value : 'The configured value'
  logWrapper.fail(`${label} is not a valid QoS.`)
  process.exit(1)
}

const parseQoS = (value: string, previous: number[] | undefined) => {
  const parsedValue = parseQoSValue(value)
  return previous ? [...previous, parsedValue] : [parsedValue]
}

const parseVariadicOfBooleanType = (value: string, previous: boolean[] | undefined) => {
  if (!['true', 'false'].includes(value)) {
    logWrapper.fail(`${value} is not a boolean.`)
    process.exit(1)
  } else {
    const booleanValue = value === 'true'
    return previous ? [...previous, booleanValue] : [booleanValue]
  }
}

const checkTopicExists = (topic: string | string[] | undefined, commandType: CommandType) => {
  if (!topic) {
    if (['pub', 'benchPub', 'simulate'].includes(commandType)) {
      console.log("error: required option '-t, --topic <TOPIC>' not specified")
    } else if (['sub', 'benchSub'].includes(commandType)) {
      console.log("error: required option '-t, --topic <TOPIC...>' not specified")
    }
    process.exit(1)
  }
}

const parsePubTopic = (value: string) => {
  if (value.includes('+') || value.includes('#')) {
    logWrapper.fail('You cannot publish the message to a Topic that contains wildcards characters #, +')
    process.exit(1)
  }
  return value
}

const parseFileRead = (value: string) => {
  const filePath = processPath(value)
  if (!filePath) {
    logWrapper.fail('A valid file path is required when reading from file.')
    process.exit(1)
  }

  let fileSize: number
  try {
    fileSize = fs.statSync(filePath).size
  } catch (error) {
    logWrapper.fail((error as Error).toString())
    process.exit(1)
  }
  if (fileSize >= MQTT_SINGLE_MESSAGE_BYTE_LIMIT) {
    logWrapper.fail('File size over 256MB not supported by MQTT.')
    process.exit(1)
  }
  return value
}

const parseFileSave = (value: string) => {
  const filePath = processPath(value)
  if (!filePath) {
    logWrapper.fail('A valid file path is required when saving to file.')
    process.exit(1)
  }
  return filePath
}

const parseFileWrite = (value: string) => {
  const filePath = processPath(value)
  if (!filePath) {
    logWrapper.fail('A valid file path is required when writing to file.')
    process.exit(1)
  }
  return filePath
}

const parseFormat = (value: string) => {
  if (!['base64', 'json', 'hex', 'cbor', 'binary', 'msgpack'].includes(value)) {
    logWrapper.fail('Not a valid format type.')
    process.exit(1)
  }
  return value
}

const parseSchemaOptions = (
  protobufPath?: string,
  protobufMessageName?: string,
  avscPath?: string,
): SchemaOptions | undefined => {
  if (protobufPath && protobufMessageName) {
    return {
      type: 'protobuf',
      protobufPath,
      protobufMessageName,
    }
  } else if (avscPath) {
    return {
      type: 'avro',
      avscPath,
    }
  } else {
    return undefined
  }
}

const parseOutputMode = (value: string) => {
  if (!['clean', 'default'].includes(value)) {
    logWrapper.fail('Not a valid output mode.')
    process.exit(1)
  }
  return value
}

const parseAuthenticationMethod = (value: string) => {
  if (!['SCRAM-SHA-1', 'SCRAM-SHA-256', 'SCRAM-SHA-512'].includes(value)) {
    logWrapper.fail('Authentication method must be one of: SCRAM-SHA-1, SCRAM-SHA-256, SCRAM-SHA-512')
    process.exit(1)
  }
  return value
}

const checkScenarioExists = (name?: string, file?: string) => {
  if (!name && !file) {
    console.log(
      "error: required option '-sc, --scenario <SCENARIO>' or '-f, --file <SCENARIO FILE PATH>' not specified",
    )
    process.exit(1)
  }
  if (name) {
    const scenarioList = getLocalScenarioList()
    if (scenarioList.length === 0) {
      logWrapper.fail('No local scenario found.')
      process.exit(1)
    }
    if (!scenarioList.includes(name)) {
      logWrapper.fail(`Scenario ${name} not found in [${scenarioList.join(', ')}]`)
      process.exit(1)
    }
  } else if (file) {
    if (!getScenarioFilePath(file)) {
      logWrapper.fail(`Scenario file ${file} not found.`)
      process.exit(1)
    }
    if (!file.endsWith('.js')) {
      logWrapper.fail(`Scenario file ${file} is not a JavaScript file.`)
      process.exit(1)
    }
  }
}

const parseWsHeaders = (wsHeaders: Record<string, string>, protocol: Protocol) => {
  if (!['ws', 'wss'].includes(protocol)) {
    logWrapper.fail('WebSocket headers are only supported with WebSocket connections (ws or wss).')
    process.exit(1)
  }
  return {
    headers: wsHeaders,
  }
}

const parseConnectOptions = (
  options: ConnectOptions | PublishOptions | SubscribeOptions,
  commandType?: CommandType,
) => {
  const {
    mqttVersion,
    hostname,
    port,
    clientId,
    clean,
    keepalive,
    username,
    password,
    protocol,
    path,
    wsHeaders,
    key,
    cert,
    ca,
    insecure,
    alpn,
    reconnectPeriod,
    sessionExpiryInterval,
    receiveMaximum,
    maximumPacketSize,
    topicAliasMaximum,
    reqResponseInfo,
    reqProblemInfo,
    authenticationMethod,
    willTopic,
    willMessage,
    willQos,
    willRetain,
    willDelayInterval,
    willPayloadFormatIndicator,
    willMessageExpiryInterval,
    willContentType,
    willResponseTopic,
    willCorrelationData,
    willUserProperties,
  } = options

  const connectOptions: IClientOptions = {
    protocolVersion: mqttVersion,
    hostname,
    port,
    clientId,
    clean,
    keepalive,
    username,
    password,
    protocol,
    path,
    reconnectPeriod,
  }

  if (key) {
    connectOptions.key = fs.readFileSync(key)
  }

  if (cert) {
    connectOptions.cert = fs.readFileSync(cert)
  }

  if (ca) {
    connectOptions.ca = fs.readFileSync(ca)
  }

  if (insecure) {
    connectOptions.rejectUnauthorized = false
  }

  if (alpn) {
    connectOptions.ALPNProtocols = alpn
  }

  if (wsHeaders && protocol) {
    connectOptions.wsOptions = parseWsHeaders(wsHeaders, protocol)
  }

  if (willTopic) {
    const will = {
      topic: willTopic,
      payload: willMessage,
      qos: willQos,
      retain: willRetain,
    }

    connectOptions.will = Object.fromEntries(
      Object.entries(will).filter(([_, v]) => v !== null && v !== undefined),
    ) as unknown as IClientOptions['will']

    const willProperties = {
      willDelayInterval,
      payloadFormatIndicator: willPayloadFormatIndicator,
      messageExpiryInterval: willMessageExpiryInterval,
      contentType: willContentType,
      responseTopic: willResponseTopic,
      correlationData: willCorrelationData,
      userProperties: willUserProperties,
    }

    connectOptions.will &&
      (connectOptions.will.properties = Object.fromEntries(
        Object.entries(willProperties).filter(([_, v]) => v !== null && v !== undefined),
      ))
  }
  let optionsTempWorkAround
  if (mqttVersion === 3) {
    connectOptions.protocolId = 'MQIsdp'
  } else if (mqttVersion === 5) {
    let userProperties =
      commandType === 'conn' ? options.userProperties : (<PublishOptions | SubscribeOptions>options).connUserProperties
    if ((commandType === 'pub' || commandType === 'benchPub') && (options as PublishOptions).batchNegotiate) {
      userProperties = { ...userProperties, 'batch-publish': 'v1' }
    }
    const properties = {
      sessionExpiryInterval,
      receiveMaximum,
      maximumPacketSize,
      topicAliasMaximum,
      requestResponseInformation: reqResponseInfo,
      requestProblemInformation: reqProblemInfo,
      userProperties,
      authenticationMethod,
    }

    if (clean === false) {
      if (sessionExpiryInterval !== undefined) {
        properties.sessionExpiryInterval = sessionExpiryInterval
      } else {
        properties.sessionExpiryInterval = parseInt('0xFFFFFFFF', 16)
      }
    }

    connectOptions.properties = Object.fromEntries(
      Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined),
    )
    // Map options.properties.topicAliasMaximum to options.topicAliasMaximum, as that is where MQTT.js looks for it.
    // TODO: remove after bug fixed in MQTT.js v5.
    optionsTempWorkAround = Object.assign(
      { topicAliasMaximum: connectOptions.properties ? connectOptions.properties.topicAliasMaximum : undefined },
      connectOptions,
    )
  }

  return optionsTempWorkAround || connectOptions
}

const parsePublishOptions = (options: PublishOptions) => {
  const {
    topic,
    message,
    qos,
    retain,
    dup,
    payloadFormatIndicator,
    messageExpiryInterval,
    topicAlias,
    responseTopic,
    correlationData,
    userProperties,
    subscriptionIdentifier,
    contentType,
    protobufPath,
    protobufMessageName,
    avscPath,
    format,
  } = options

  const publishOptions: IClientPublishOptions = {
    qos,
    retain,
    dup,
  }

  const schemaOptions: SchemaOptions | undefined = parseSchemaOptions(protobufPath, protobufMessageName, avscPath)

  if (options.mqttVersion === 5) {
    const properties = {
      payloadFormatIndicator,
      messageExpiryInterval,
      topicAlias,
      responseTopic,
      correlationData,
      userProperties,
      subscriptionIdentifier,
      contentType,
    }

    publishOptions.properties = Object.fromEntries(
      Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined),
    )
  }

  return {
    topic,
    message,
    schemaOptions,
    format,
    opts: publishOptions,
  }
}

const parseSubscribeOptions = (options: SubscribeOptions) => {
  const {
    mqttVersion,
    topic,
    qos,
    no_local,
    retainAsPublished,
    retainHandling,
    subscriptionIdentifier,
    userProperties,
  } = options

  const subOptionsArray: IClientSubscribeOptions[] = []

  topic.forEach((t: string, index: number) => {
    const subOptions: IClientSubscribeOptions = {
      qos: getSpecialTypesOption(qos, index, 0) as IClientSubscribeOptions['qos'],
      nl: getSpecialTypesOption(no_local, index),
      rap: getSpecialTypesOption(retainAsPublished, index),
      rh: getSpecialTypesOption(retainHandling, index),
    }

    if (mqttVersion === 5) {
      const properties = {
        subscriptionIdentifier: getSpecialTypesOption(subscriptionIdentifier as number[], index),
        userProperties,
      }

      subOptions.properties = Object.fromEntries(
        Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined),
      )
    }

    subOptionsArray.push(subOptions)
  })

  return subOptionsArray
}

export {
  parseNumber,
  validateClientCount,
  validateMaxInflight,
  parseProtocol,
  parseMQTTVersion,
  parseKeyValues,
  parseMessage,
  validateBatchOptions,
  parseQoS,
  parseQoSValue,
  parseVariadicOfBooleanType,
  checkTopicExists,
  checkScenarioExists,
  parsePubTopic,
  parseFileRead,
  parseFileSave,
  parseFileWrite,
  parseFormat,
  parseSchemaOptions,
  parseOutputMode,
  parseAuthenticationMethod,
  parseConnectOptions,
  parsePublishOptions,
  parseSubscribeOptions,
}
