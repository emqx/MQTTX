import { IConnackPacket } from 'mqtt'

declare module 'mqtt' {
  interface MqttClient {
    // MQTT.js 4.3.7 saves this packet at runtime but omits it from its declarations.
    connackPacket?: IConnackPacket
  }
}
