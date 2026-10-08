import 'mqtt'

declare module 'mqtt' {
  interface MqttClient {
    responseInformation?: string
  }
}
