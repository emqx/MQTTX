import { MqttClient } from 'mqtt'

type QoS = 0 | 1 | 2
type searchCallBack = (data: ConnectionModel[]) => ConnectionModel[]
type nameCallBack = (name: string) => string

export interface SearchCallBack {
  callBack: searchCallBack
}

export interface NameCallBack {
  callBack: nameCallBack
}

export interface FormRule {
  field: string
  fullField: string
  type: string
  validator: () => void
}

export interface MessageModel {
  id?: string
  createAt: string
  out: boolean
  payload: string
  qos: QoS
  retain: boolean
  topic: string
  color?: string
  properties?: PushPropertiesModel
}

export interface SSLPath {
  rejectUnauthorized?: boolean
  ca: string
  cert: string
  key: string
}

export interface WillPropertiesModel {
  willDelayInterval?: number | null
  payloadFormatIndicator?: boolean | null
  messageExpiryInterval?: number | null
  contentType?: string | null
  responseTopic?: string | null
  correlationData?: string | Buffer | null
  userProperties?: Object | null
}

interface WillModel {
  id?: string
  lastWillTopic: string
  lastWillPayload: string
  lastWillQos: QoS
  lastWillRetain: boolean
  properties?: WillPropertiesModel
}
export interface ConnectionModel extends SSLPath {
  readonly id?: string
  clientId: string
  name: string
  clean: boolean
  protocol?: Protocol
  host: string
  port: number
  keepalive: number
  connectTimeout: number
  reconnect: boolean
  username: string
  password: string
  path: string
  certType?: '' | 'server' | 'self'
  ssl: boolean
  mqttVersion: '3.1.1' | '5.0'
  unreadMessageCount: number
  messages: MessageModel[]
  subscriptions: SubscriptionModel[]
  client:
    | MqttClient
    | {
        connected: boolean
      }
  will?: WillModel
  properties?: ClientPropertiesModel
}

// MQTT 5 feature
export interface ClientPropertiesModel {
  sessionExpiryInterval?: number | null
  receiveMaximum?: number | null
  maximumPacketSize?: number | null
  topicAliasMaximum?: number | null
  requestResponseInformation?: boolean | null
  requestProblemInformation?: boolean | null
  userProperties?: Object | null
  authenticationMethod?: string | null
  authenticationData?: Buffer | null
}

// MQTT 5 feature
interface PushPropertiesModel {
  payloadFormatIndicator?: boolean | null
  messageExpiryInterval?: number | null
  topicAlias?: number | null
  responseTopic?: string | null
  correlationData?: string | Buffer | null
  userProperties?: Object | null
  subscriptionIdentifier?: number | null
  contentType?: string | null
}

export interface SSLContent {
  ca: string | string[] | Buffer | Buffer[] | undefined
  cert: string | string[] | Buffer | Buffer[] | undefined
  key: string | string[] | Buffer | Buffer[] | undefined
}

export interface ContextmenuModel {
  top: number
  left: number
}
