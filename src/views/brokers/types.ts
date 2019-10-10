export interface BrokerModel {
  brokerName: string
  brokerAddress: string
  brokerPort: string
  tls: boolean
  id?: string
  certType?: string
}
