import { IClientOptions } from 'mqtt'
import time from '@/utils/time'
import { getSSLFile } from '@/utils/getFiles'
import { ConnectionModel, SSLPath, SSLContent } from '@/views/connections/types'

const setMQTT5Properties = (
  option: IClientOptions['properties'],
): IClientOptions['properties'] | undefined => {
  if (option === undefined) {
    return undefined
  }
  const properties: IClientOptions['properties'] = {}
  if (option.sessionExpiryInterval ||
    option.sessionExpiryInterval === 0) {
    properties.sessionExpiryInterval = option.sessionExpiryInterval
  }
  if (option.receiveMaximum ||
    option.sessionExpiryInterval === 0) {
    properties.receiveMaximum = option.receiveMaximum
  }
  return properties
}

export const getClientOptions = (
  record: ConnectionModel,
): IClientOptions => {
  const mqttVersionDict = {
    '3.1.1': 4,
    '5.0': 5,
  }
  const {
    clientId, username, password, keepalive, clean, connectTimeout,
    ssl, certType, mqttVersion, reconnect, will,
  } = record
  // reconnectPeriod = 0 disabled automatic reconnection in the client
  const reconnectPeriod = reconnect ? 4000 : 0
  const protocolVersion = mqttVersionDict[mqttVersion]
  const options: IClientOptions  = {
    clientId,
    keepalive,
    clean,
    reconnectPeriod,
    protocolVersion,
  }
  options.connectTimeout = time.convertSecondsToMs(connectTimeout)
  // Auth
  if (username !== '') {
    options.username = username
  }
  if (password !== '') {
    options.password = password
  }
  // MQTT Version
  if (protocolVersion === 5) {
    const { sessionExpiryInterval, receiveMaximum } = record
    const properties = setMQTT5Properties({
      sessionExpiryInterval,
      receiveMaximum,
    })
    if (properties && Object.keys(properties).length > 0) {
      options.properties =  properties
    }
  }
  // SSL
  if (ssl && certType === 'self') {
    const filePath: SSLPath = {
      ca: record.ca,
      cert: record.cert,
      key: record.key,
    }
    const sslRes: SSLContent | undefined = getSSLFile(filePath)
    if (sslRes) {
      options.rejectUnauthorized = false
      options.ca = sslRes.ca
      options.cert = sslRes.cert
      options.key = sslRes.key
    }
  }
  // Will Message
  if (will) {
    const {
      lastWillTopic: topic,
      lastWillPayload: payload,
      lastWillQos: qos,
      lastWillRetain: retain,
    } = will
    if (topic) {
      options.will = { topic, payload, qos, retain }
    }
  }
  return options
}

// Prevent old data from missing protocol field
export const getMQTTProtocol = (data: ConnectionModel): Protocol => {
  const { protocol, ssl } = data
  if (!protocol) {
    return ssl ? 'mqtts' : 'mqtt'
  }
  return protocol
}

export default {}
