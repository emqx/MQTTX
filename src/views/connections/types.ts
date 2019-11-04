export interface MessageModel {
  createAt: string
  out: boolean
  payload: string
  qos: number
  retain: boolean
  topic: string
}

export interface ConnectionModel  {
  readonly id?: string,
  readonly clientuuid: string,
  readonly brokeruuid: string,
  clientId: string,
  name: string,
  clean: boolean,
  host: string,
  keepalive: number,
  messages: MessageModel[] | [],
  username: string,
  password: string,
  path: string,
  port: number,
  ssl: boolean,
  subscriptions: SubscriptionModel[] | [],
  unreadMessageCount: number,
  client: $TSFixed,
  ca?: string,
  cert?: string,
  key?: string,
}
