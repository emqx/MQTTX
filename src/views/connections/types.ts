import { MqttClient } from 'mqtt'

type QoS = 0 | 1 | 2

export interface MessageModel {
  createAt: string,
  out: boolean,
  payload: string,
  qos: QoS,
  retain: boolean,
  topic: string,
}

export interface SSLPath {
  rejectUnauthorized?: boolean,
  ca: string,
  cert: string,
  key: string,
}

export interface ConnectionModel extends SSLPath  {
  readonly id?: string,
  clientId: string,
  name: string,
  clean: boolean,
  protocol?: Protocol,
  host: string,
  port: number,
  keepalive: number,
  connectTimeout: number,
  reconnect: boolean,
  username: string,
  password: string,
  path: string,
  certType?: '' | 'server' | 'self',
  ssl: boolean,
  mqttVersion: '3.1.1' | '5.0',
  unreadMessageCount: number,
  messages: MessageModel[],
  subscriptions: SubscriptionModel[],
  client: MqttClient | {
    connected: boolean,
  },
  sessionExpiryInterval?: number,
  receiveMaximum?: number,
  topicAliasMaximum?: number,
  requestResponseInformation?: boolean,
  requestProblemInformation?: boolean,
  will?: {
    lastWillTopic: string,
    lastWillPayload: string,
    lastWillQos: QoS,
    lastWillRetain: boolean,
  },
}

export interface SSLContent {
  ca: string | string[] | Buffer | Buffer[] | undefined,
  cert: string | string[] | Buffer | Buffer[] | undefined,
  key: string | string[] | Buffer | Buffer[] | undefined,
}
