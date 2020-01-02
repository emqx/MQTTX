import { MqttClient } from 'mqtt'

export interface MessageModel {
  createAt: string,
  out: boolean,
  payload: string,
  qos: number,
  retain: boolean,
  topic: string,
}

export interface SSLPath {
  ca: string,
  cert: string,
  key: string,
}

export interface ConnectionModel extends SSLPath  {
  readonly id?: string,
  clientId: string,
  name: string,
  clean: boolean,
  host: string,
  port: number,
  keepalive: number,
  connectTimeout: number,
  reconnect: boolean,
  username: string,
  password: string,
  path: string,
  certType?: '' | 'ca' | 'self',
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
}

export interface SSLContent {
  ca: string | string[] | Buffer | Buffer[] | undefined,
  cert: string | string[] | Buffer | Buffer[] | undefined,
  key: string | string[] | Buffer | Buffer[] | undefined,
}
