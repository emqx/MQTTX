declare global {
  type MQTTVersion = 3 | 4 | 5

  type Protocol = 'mqtt' | 'mqtts'

  type QoS = 0 | 1 | 2

  interface ConnectOptions {
    mqttVersion: MQTTVersion
    hostname: string
    port?: number
    clientId: string
    clean: boolean
    keepalive: number
    username?: string
    password?: string
    protocol?: Protocol
    key?: string
    cert?: string
    ca?: string
    insecure?: boolean
    sessionExpiryInterval?: number
    receiveMaximum?: number
    maximumPacketSize?: number
    topicAliasMaximum?: number
    reqResponseInfo?: boolean
    reqProblemInfo?: boolean
    userProperties?: Record<string, string>
    willTopic?: string
    willMessage?: string
    willQos?: QoS
    willRetain?: boolean
  }
}

export {}
