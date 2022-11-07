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
    reconnectPeriod: number
    // properties of MQTT 5.0
    sessionExpiryInterval?: number
    receiveMaximum?: number
    maximumPacketSize?: number
    topicAliasMaximum?: number
    reqResponseInfo?: boolean
    reqProblemInfo?: boolean
    userProperties?: Record<string, string>
    // will message
    willTopic?: string
    willMessage?: string
    willQos?: QoS
    willRetain?: boolean
    // will message properties of MQTT 5.0
    willDelayInterval?: number
    willPayloadFormatIndicator?: boolean
    willMessageExpiryInterval?: number
    willContentType?: string
    willResponseTopic?: string
    willCorrelationData?: string
    willUserProperties?: Record<string, string>
  }

  interface PublishOptions extends ConnectOptions {
    topic: string
    message: string | Buffer
    qos: QoS
    retain?: boolean
    dup?: boolean
    stdin?: boolean
    multiline?: boolean
    // properties of MQTT 5.0
    payloadFormatIndicator?: boolean
    messageExpiryInterval?: number
    topicAlias?: number
    responseTopic?: string
    correlationData?: string
    subscriptionIdentifier?: number
    contentType?: string
    connUserProperties?: Record<string, string>
  }

  interface SubscribeOptions extends ConnectOptions {
    topic: string[]
    qos?: QoS[]
    // properties of MQTT 5.0
    no_local?: boolean[]
    retainAsPublished?: boolean[]
    retainHandling?: QoS[]
    subscriptionIdentifier?: number[]
    verbose: boolean
    connUserProperties?: Record<string, string>
  }

  interface BenchConnectOptions extends ConnectOptions {
    count: number
    interval: number
  }

  type OmitPublishOptions = Omit<PublishOptions, 'stdin' | 'multiline'>
  interface BenchPublishOptions extends OmitPublishOptions {
    count: number
    interval: number
    messageInterval: number
    verbose: boolean
  }

  interface BenchSubscribeOptions extends SubscribeOptions {
    count: number
    interval: number
  }
}

export {}
