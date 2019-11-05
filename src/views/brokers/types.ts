export interface BrokerModel {
  brokerName: string
  brokerAddress: string
  brokerPort: number
  tls: boolean
  certType?: string
  readonly id?: string
}

export interface ClientModel {
  brokeruuid: string
  clientName: string
  clientId: string
  username?: string
  password?: string
  keepAlive: number,
  connectionTimeout?: number
  cleanSession: boolean
  autoReconnect: boolean
  mqttVersion: string
  ca: string
  cert: string
  key: string
  readonly id?: string
}
