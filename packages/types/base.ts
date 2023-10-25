export type MQTTVersion = 3 | 4 | 5

export type Protocol = 'mqtt' | 'mqtts'

export type QoS = 0 | 1 | 2

export default {}

export interface Connection {
  id: string,
  name: string,
}
