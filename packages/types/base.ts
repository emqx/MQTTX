export type MQTTVersion = 3 | 4 | 5

export type Protocol = 'mqtt' | 'mqtts'

export type QoS = 0 | 1 | 2

export type Lang = 'en' | 'zh' | 'ja' | 'hu' | 'tr'

export default {}

export interface Connection {
  id: string
  name: string
}

export interface ConnectionDetail {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  lastConnected: string
  topics: string[]
}
