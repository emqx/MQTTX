import mqtt, { MqttClient, IClientOptions } from 'mqtt'
import Store from '@/store'
import { getClientId } from '@/utils/idGenerator'
import time from '@/utils/time'
import { getSSLFile } from '@/utils/getFiles'
import _ from 'lodash'

const setMQTT5Properties = ({ clean, properties: option }: ConnectionModel) => {
  if (option === undefined) {
    return undefined
  }
  const properties: ClientPropertiesModel = _.cloneDeep(option)
  if (properties.sessionExpiryInterval === null && !clean) {
    /**
      Clean Start set True and Session Expiry Interval set 0, the server MUST delete any Session State it holds for the Client
      Clean Start set False and Session Expiry Interval set 4294967295, the server MUST NOT delete any Session State it holds for the Client
      Non-standard usage, user-friendly only, remember that Clean Start needs to be used with sessionExpiryInterval In MQTT 5.0
    **/
    properties.sessionExpiryInterval = 4294967295
  }
  return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined))
}

const setWillMQTT5Properties = (option: WillPropertiesModel) => {
  if (option === undefined) {
    return undefined
  }
  const properties: WillPropertiesModel = _.cloneDeep(option)
  return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined))
}

const getClientOptions = (record: ConnectionModel): IClientOptions => {
  const mqttVersionDict = {
    '3.1': 3,
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
    reconnectPeriod, // reconnectPeriod = 0 disabled automatic reconnection in the client
    will,
    rejectUnauthorized,
    clientIdWithTime,
  } = record
  const protocolVersion = mqttVersionDict[mqttVersion as '3.1' | '3.1.1' | '5.0']
  const options: IClientOptions = {
    clientId,
    username,
    keepalive,
    clean,
    reconnectPeriod: reconnect ? reconnectPeriod : 0,
    protocolVersion,
  }
  options.connectTimeout = time.convertSecondsToMs(connectTimeout)
  // Append timestamp to MQTT client id
  if (clientIdWithTime) {
    const clickIconTime = Date.parse(new Date().toString())
    options.clientId = `${options.clientId}_${clickIconTime}`
  }
  // Auth
  if (password !== '') {
    options.password = password
  }
  // MQTT Version
  if (protocolVersion === 5 && record.properties) {
    const properties = setMQTT5Properties(record)
    if (properties && Object.keys(properties).length > 0) {
      options.properties = properties
    }
  } else if (protocolVersion === 3) {
    options.protocolId = 'MQIsdp'
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
  // Auto Resubscribe, Valid only when reconnecting
  options.resubscribe = Store.getters.autoResub
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

  // Map options.properties.topicAliasMaximum to options.topicAliasMaximum, as that is where MQTT.js looks for it.
  // TODO: remove after bug fixed in MQTT.js.
  const tempOptions = {
    ...options,
    topicAliasMaximum: options.properties ? options.properties.topicAliasMaximum : undefined,
  }
  const curConnectClient: MqttClient = mqtt.connect(url, tempOptions)

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
    reconnectPeriod: 4000,
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
    mqttVersion: '5.0',
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
      sessionExpiryInterval: 0,
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
