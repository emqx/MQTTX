import { MqttClient } from 'mqtt'
export interface MessageModel {
  createAt: string
  out: boolean
  payload: string
  qos: number
  retain: boolean
  topic: string
}

export interface SSLPath {
  ca: string,
  cert: string,
  key: string,
}

export interface ConnectionModel extends SSLPath  {
  readonly id?: string,
  readonly clientuuid: string,
  readonly brokeruuid: string,
  clientId: string,
  name: string,
  clean: boolean,
  host: string,
  keepalive: number,
  connectTimeout: number,
  messages: MessageModel[],
  username: string,
  password: string,
  path: string,
  port: number,
  ssl: boolean,
  subscriptions: SubscriptionModel[],
  unreadMessageCount: number,
  client: MqttClient | {
    connected: boolean,
  },
}

export interface SSLContent {
  ca: string | string[] | Buffer | Buffer[] | undefined,
  cert: string | string[] | Buffer | Buffer[] | undefined,
  key: string | string[] | Buffer | Buffer[] | undefined,
}
