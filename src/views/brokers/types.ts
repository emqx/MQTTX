export interface BrokerModel {
  brokerName: string
  brokerAddress: string
  brokerPort: string
  tls: boolean
  id?: string
  certType?: string
}

export interface ClientModel {
  brokerId: string
  clientName: string
  clientId: string
  username?: string
  password?: string
  connectionTimeout?: string
  cleanSession: boolean
  autoReconnect: boolean
  mqttVersion: string
  ca: string
  cert: string
  key: string
  id?: string,
}
