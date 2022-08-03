import { IClientOptions } from 'mqtt'
import time from '@/utils/time'
import { getSSLFile } from '@/utils/getFiles'
import { ConnectionModel, SSLContent, WillPropertiesModel, ClientPropertiesModel } from '@/views/connections/types'
import _ from 'lodash'

const setMQTT5Properties = (option: ClientPropertiesModel) => {
  if (option === undefined) {
    return undefined
  }
  const properties: ClientPropertiesModel = _.cloneDeep(option)
  return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined))
}

export const getClientOptions = (record: ConnectionModel): IClientOptions => {
  const mqttVersionDict = {
    '3.1.1': 4,
    '5.0': 5,
  }
  const {
    clientId,
    username,
    password,
    keepalive,
    clean,
    connectTimeout,
    ssl,
    certType,
    mqttVersion,
    reconnect,
    will,
    rejectUnauthorized,
  } = record
  // reconnectPeriod = 0 disabled automatic reconnection in the client
  const reconnectPeriod = reconnect ? 4000 : 0
  const protocolVersion = mqttVersionDict[mqttVersion]
  const options: IClientOptions = {
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
  if (protocolVersion === 5 && record.properties) {
    const properties = setMQTT5Properties(record.properties)
    if (properties && Object.keys(properties).length > 0) {
      options.properties = properties
    }
  }
  // SSL
  if (ssl) {
    switch (certType) {
      case 'self':
        const sslRes: SSLContent | undefined = getSSLFile({
          ca: record.ca,
          cert: record.cert,
          key: record.key,
        })
        if (sslRes) {
          options.ca = sslRes.ca
          options.cert = sslRes.cert
          options.key = sslRes.key
          if (rejectUnauthorized === undefined) {
            options.rejectUnauthorized = false
          } else {
            options.rejectUnauthorized = rejectUnauthorized
          }
        }
        break
      default:
        options.rejectUnauthorized = false
        break
    }
  }
  // Will Message
  if (will) {
    const { lastWillTopic: topic, lastWillPayload: payload, lastWillQos: qos, lastWillRetain: retain } = will
    if (topic) {
      options.will = { topic, payload, qos, retain }
      if (protocolVersion === 5) {
        const { properties } = will
        const willProperties: WillPropertiesModel | undefined = {}
        if (properties !== undefined) {
          if (properties.willDelayInterval || properties.willDelayInterval === 0) {
            willProperties.willDelayInterval = properties.willDelayInterval
          }
          if (properties.messageExpiryInterval || properties.messageExpiryInterval === 0) {
            willProperties.messageExpiryInterval = properties.messageExpiryInterval
          }
          if (properties.contentType !== '') {
            willProperties.contentType = properties.contentType
          }
          if (properties.payloadFormatIndicator !== undefined) {
            willProperties.payloadFormatIndicator = properties.payloadFormatIndicator
          }
        }
        if (willProperties && Object.keys(willProperties).length > 0) {
          options.will.properties = willProperties
        }
      }
    }
  }
  return options
}

// Prevent old data from missing protocol field
export const getMQTTProtocol = (data: ConnectionModel): Protocol => {
  const { protocol, ssl } = data
  if (!protocol) {
    return ssl ? 'wss' : 'ws'
  }
  return protocol
}

export default {}
