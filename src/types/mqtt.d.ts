import { IConnackPacket } from 'mqtt'

declare module 'mqtt' {
  interface MqttClient {
    connackPacket?: IConnackPacket
  }
}
