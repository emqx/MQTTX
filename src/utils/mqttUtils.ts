import { IClientOptions } from 'mqtt'
import time from '@/utils/time'
import { getSSLFile } from '@/utils/getFiles'
import useServices from '@/database/useServices'
import _ from 'lodash'

const setMQTT5Properties = (option: IClientOptions['properties']): IClientOptions['properties'] | undefined => {
  if (option === undefined) {
    return undefined
  }
  const properties: IClientOptions['properties'] = _.cloneDeep(option)
  return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined && v !== ''))
}

const setWillMQTT5Properties = (option: WillPropertiesModel): WillPropertiesModel | undefined => {
  if (option === undefined) {
    return undefined
  }
  const properties: WillPropertiesModel = _.cloneDeep(option)
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
    clientIdWithTime,
  } = record
  // reconnectPeriod = 0 disabled automatic reconnection in the client
  const reconnectPeriod = reconnect ? 4000 : 0
  const protocolVersion = mqttVersionDict[mqttVersion as '3.1.1' | '5.0']
  const options: IClientOptions = {
    clientId,
    keepalive,
    clean,
    reconnectPeriod,
    protocolVersion,
  }
  options.connectTimeout = time.convertSecondsToMs(connectTimeout)
  // Append timestamp to MQTT client id
  if (clientIdWithTime) {
    const clickIconTime = Date.parse(new Date().toString())
    options.clientId = `${options.clientId}_${clickIconTime}`
  }
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
    options.rejectUnauthorized = rejectUnauthorized === undefined ? true : rejectUnauthorized
    if (certType === 'self') {
      const sslRes: SSLContent | undefined = getSSLFile({
        ca: record.ca,
        cert: record.cert,
        key: record.key,
      })
      if (sslRes) {
        options.ca = sslRes.ca
        options.cert = sslRes.cert
        options.key = sslRes.key
      }
    }
  }
  // Will Message
  if (will) {
    const { lastWillTopic: topic, lastWillPayload: payload, lastWillQos: qos, lastWillRetain: retain } = will
    if (topic) {
      options.will = { topic, payload, qos: qos as QoS, retain }
      if (protocolVersion === 5) {
        const { properties } = will
        if (properties) {
          const willProperties = setWillMQTT5Properties(properties)
          if (willProperties && Object.keys(willProperties).length > 0) {
            options.will.properties = willProperties
          }
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
    return ssl ? 'mqtts' : 'mqtt'
  }
  return protocol as Protocol
}

export const hasMessagePayloadID = async (data: HistoryMessagePayloadModel): Promise<string | null> => {
  const { historyMessagePayloadService } = useServices()
  const payloads = await historyMessagePayloadService.getAll()
  if (payloads) {
    const res = payloads.find((el: HistoryMessagePayloadModel) => {
      return data.payload === el.payload && data.payloadType === el.payloadType
    })
    return res?.id ?? null
  }
  return null
}

export const hasMessageHeaderID = async (data: HistoryMessageHeaderModel): Promise<string | null> => {
  const { historyMessageHeaderService } = useServices()
  const headers = await historyMessageHeaderService.getAll()
  if (headers) {
    const res = headers.find((el: HistoryMessageHeaderModel) => {
      return data.qos === el.qos && data.topic === el.topic && data.retain === el.retain
    })
    return res?.id ?? null
  }
  return null
}

export default {}
