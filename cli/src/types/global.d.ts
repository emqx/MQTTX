declare global {
  type CommandType = 'conn' | 'pub' | 'sub'

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

  interface PublishOptions extends ConnectOptions {
    topic: string
    message?: string | Buffer
    qos: QoS
    retain?: boolean
    dup?: boolean
    stdin?: boolean
    multiline?: boolean
    payloadFormatIndicator?: boolean
    messageExpiryInterval?: number
    topicAlias?: number
    responseTopic?: string
    correlationData?: string
    subscriptionIdentifier?: number
    contentType?: string
  }

  interface SubscribeOptions extends ConnectOptions {
    topic: string[]
    qos?: QoS[]
    no_local?: boolean[]
    retainAsPublished?: boolean[]
    retainHandling?: QoS[]
    subscriptionIdentifier?: number[]
    verbose: boolean
  }
}

export {}
