import * as fs from 'fs'
import logWrapper from './logWrapper'
import { getSpecialTypesOption } from '../utils/generator'
import { readFile, processPath } from '../utils/fileUtils'

import { IClientOptions, IClientPublishOptions, IClientSubscribeOptions } from 'mqtt'
import { getLocalScenarioList, getScenarioFilePath } from './simulate'

const MQTT_SINGLE_MESSAGE_BYTE_LIMIT = 256 * 1024 * 1024

const parseNumber = (value: string) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    logWrapper.fail(`${value} is not a number.`)
    process.exit(1)
  }
  return parsedValue
}

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
  // Normalize '5.0' to '5'
  const normalizedValue = value === '5.0' ? '5' : value
  if (!dict[normalizedValue]) {
    logWrapper.fail('Not a valid MQTT version.')
    process.exit(1)
  }
  return dict[normalizedValue as '3.1' | '3.1.1' | '5']
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

const parseQoS = (value: string, previous: number[] | undefined) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 2) {
    logWrapper.fail(`${value} is not a valid QoS.`)
    process.exit(1)
  } else {
    return previous ? [...previous, parsedValue] : [parsedValue]
  }
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

  const fileContent = readFile(filePath)
  if (fileContent.length >= MQTT_SINGLE_MESSAGE_BYTE_LIMIT) {
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
  if (!['base64', 'json', 'hex', 'cbor', 'binary'].includes(value)) {
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
    const userProperties =
      commandType === 'conn' ? options.userProperties : (<PublishOptions | SubscribeOptions>options).connUserProperties
    const properties = {
      sessionExpiryInterval,
      receiveMaximum,
      maximumPacketSize,
      topicAliasMaximum,
      requestResponseInformation: reqResponseInfo,
      requestProblemInformation: reqProblemInfo,
      userProperties,
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

  return { topic, message, schemaOptions, format, opts: publishOptions }
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
  parseProtocol,
  parseMQTTVersion,
  parseKeyValues,
  parseQoS,
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
  parseConnectOptions,
  parsePublishOptions,
  parseSubscribeOptions,
}
