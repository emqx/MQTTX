import mqtt, { MqttClient, IClientOptions } from 'mqtt'
import { getClientId } from '@/utils/idGenerator'
import time from '@/utils/time'
import { getSSLFile } from '@/utils/getFiles'
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

const getClientOptions = (record: ConnectionModel): IClientOptions => {
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
    resubscribe,
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
  // Auto Resubscribe
  if (resubscribe) {
    options.resubscribe = resubscribe
  }
  return options
}

const getUrl = (record: ConnectionModel): string => {
  const { host, port, path } = record
  const protocol = getMQTTProtocol(record)

  let url = `${protocol}://${host}:${port}`
  if (protocol === 'ws' || protocol === 'wss') {
    url = `${url}${path.startsWith('/') ? '' : '/'}${path}`
  }
  return url
}

export const createClient = (record: ConnectionModel): { curConnectClient: MqttClient; connectUrl: string } => {
  const options: IClientOptions = getClientOptions(record)
  const url = getUrl(record)
  const curConnectClient: MqttClient = mqtt.connect(url, options)

  return { curConnectClient, connectUrl: url }
}

// Prevent old data from missing protocol field
export const getMQTTProtocol = (data: ConnectionModel): Protocol => {
  const { protocol, ssl } = data
  if (!protocol) {
    return ssl ? 'mqtts' : 'mqtt'
  }
  return protocol as Protocol
}

export const getDefaultRecord = (): ConnectionModel => {
  return {
    clientId: getClientId(),
    createAt: time.getNowDate(),
    updateAt: time.getNowDate(),
    name: '',
    clean: true,
    protocol: 'mqtt',
    host: 'broker.emqx.io',
    keepalive: 60,
    connectTimeout: 10,
    reconnect: false,
    resubscribe: true,
    username: '',
    password: '',
    path: '/mqtt',
    port: 1883,
    ssl: false,
    certType: '',
    rejectUnauthorized: true,
    ca: '',
    cert: '',
    key: '',
    mqttVersion: '3.1.1',
    subscriptions: [],
    messages: [],
    unreadMessageCount: 0,
    will: {
      lastWillTopic: '',
      lastWillPayload: '',
      lastWillQos: 0,
      lastWillRetain: false,
      properties: {
        willDelayInterval: undefined,
        payloadFormatIndicator: undefined,
        messageExpiryInterval: undefined,
        contentType: '',
        responseTopic: '',
        correlationData: undefined,
        userProperties: undefined,
      },
    },
    properties: {
      sessionExpiryInterval: undefined,
      receiveMaximum: undefined,
      maximumPacketSize: undefined,
      topicAliasMaximum: undefined,
      requestResponseInformation: undefined,
      requestProblemInformation: undefined,
      userProperties: undefined,
      authenticationMethod: undefined,
      authenticationData: undefined,
    },
    clientIdWithTime: false,
    isCollection: false,
    parentId: null,
  }
}

export default {}
