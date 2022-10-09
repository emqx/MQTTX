import * as fs from 'fs'
import signale from '../utils/signale'
import { getSpecialTypesOption } from '../utils/generator'

import { IClientOptions, IClientPublishOptions, IClientSubscribeOptions } from 'mqtt'

const parseNumber = (value: string) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    signale.error(`${value} is not a number.`)
    process.exit(1)
  }
  return parsedValue
}

const parseProtocol = (value: string) => {
  if (!['mqtt', 'mqtts'].includes(value)) {
    signale.error('Only mqtt and mqtts are supported.')
    process.exit(1)
  }
  return value
}

const parseMQTTVersion = (value: string) => {
  const dict = {
    '3.1': 3,
    '3.1.1': 4,
    '5': 5,
  }
  if (!Object.keys(dict).includes(value)) {
    signale.error('Not a valid MQTT version.')
    process.exit(1)
  }
  return dict[value as '3.1' | '3.1.1' | '5']
}

const parseUserProperties = (value: string, previous: Record<string, unknown> | undefined) => {
  const [key, val] = value.split(': ')
  if (key && val) {
    return previous ? { ...previous, [key]: val } : { [key]: val }
  } else {
    signale.error('Not a valid user properties.')
    process.exit(1)
  }
}

const parseQoS = (value: string, previous: number[] | undefined) => {
  const parsedValue = Number(value)
  if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 2) {
    signale.error(`${value} is not a valid QoS.`)
    process.exit(1)
  } else {
    return previous ? [...previous, parsedValue] : [parsedValue]
  }
}

const parseVariadicOfBooleanType = (value: string, previous: boolean[] | undefined) => {
  if (!['true', 'false'].includes(value)) {
    signale.error(`${value} is not a boolean.`)
    process.exit(1)
  } else {
    const booleanValue = value === 'true'
    return previous ? [...previous, booleanValue] : [booleanValue]
  }
}

const parsePubTopic = (value: string) => {
  if (value.includes('+') || value.includes('#')) {
    signale.error('You cannot publish the message to a Topic that contains wildcards characters #, +')
    process.exit(1)
  }
  return value
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
    key,
    cert,
    ca,
    insecure,
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

  if (key && cert && protocol !== 'mqtts') {
    connectOptions.protocol = 'mqtts'
  }

  if (insecure) {
    connectOptions.rejectUnauthorized = false
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
        properties.sessionExpiryInterval = 4294967295
      }
    }

    connectOptions.properties = Object.fromEntries(
      Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined),
    )
  }

  return connectOptions
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
  } = options

  const publishOptions: IClientPublishOptions = {
    qos,
    retain,
    dup,
  }

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

  return { topic, message, opts: publishOptions }
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
  parseUserProperties,
  parseQoS,
  parseVariadicOfBooleanType,
  parsePubTopic,
  parseConnectOptions,
  parsePublishOptions,
  parseSubscribeOptions,
}
