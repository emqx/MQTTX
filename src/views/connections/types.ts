import { MqttClient } from 'mqtt'

type QoS = 0 | 1 | 2
type searchCallBack = (data: ConnectionModel[]) => ConnectionModel[]
type nameCallBack = (name: string) => string

export type MessageType = 'all' | 'received' | 'publish'

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
  mid: string
  createAt: string
  out: boolean
  payload: string
  qos: QoS
  retain: boolean
  topic: string
}

export interface SSLPath {
  rejectUnauthorized?: boolean
  ca: string
  cert: string
  key: string
}

export interface WillPropertiesModel {
  willDelayInterval?: number
  payloadFormatIndicator?: boolean
  messageExpiryInterval?: number
  contentType?: string
  responseTopic?: string
  correlationData?: Buffer
  userProperties?: Object
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
  sessionExpiryInterval?: number
  receiveMaximum?: number
  topicAliasMaximum?: number
  requestResponseInformation?: boolean
  requestProblemInformation?: boolean
  will?: {
    lastWillTopic: string
    lastWillPayload: string
    lastWillQos: QoS
    lastWillRetain: boolean
    properties?: WillPropertiesModel
  }
  clientIdWithTime?: boolean // fill in client_id.Ensure that client_id field is unique.
  collectionId?: string | null // if collection is null set to default
  isCollection: false
}

export interface ConnectionModelCollection {
  readonly id: string
  name: string
  children: ConnectionModelTree[] | []
  isCollection: true
  isEdit?: boolean
}

// leaf: ConnectionModel | collection: ConnectionModelCollection
export type ConnectionModelTree = ConnectionModelCollection | ConnectionModel

export interface SSLContent {
  ca: string | string[] | Buffer | Buffer[] | undefined
  cert: string | string[] | Buffer | Buffer[] | undefined
  key: string | string[] | Buffer | Buffer[] | undefined
}

export interface ContextmenuModel {
  top: number
  left: number
}

export interface ChartDataModel {
  label: string
  recevied: number
  sent: number
}

export enum SubscribeErrorReason {
  normal,
  qosSubFailed, // qos is abnormal
  qosSubSysFailed, // qos is abnormal becauseof $SYS subscribe
  emptySubFailed, // subscription returns empty array
}
