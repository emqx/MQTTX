import { Faker } from '@faker-js/faker'

declare global {
  type CommandType = 'conn' | 'pub' | 'sub' | 'benchConn' | 'benchPub' | 'benchSub' | 'simulate'

  type MQTTVersion = 3 | 4 | 5

  type Protocol = 'mqtt' | 'mqtts'

  type QoS = 0 | 1 | 2

  type FormatType = 'base64' | 'json' | 'hex'

  type OutputMode = 'clean' | 'default'

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
    path?: string
    key?: string
    cert?: string
    ca?: string
    insecure?: boolean
    alpn?: string[]
    reconnectPeriod: number
    maximumReconnectTimes: number
    // properties of MQTT 5.0
    sessionExpiryInterval?: number
    receiveMaximum?: number
    maximumPacketSize?: number
    topicAliasMaximum?: number
    reqResponseInfo?: boolean
    reqProblemInfo?: boolean
    userProperties?: Record<string, string | string[]>
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
    willUserProperties?: Record<string, string | string[]>
    save?: boolean | string
    config?: boolean | string
    debug?: boolean
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
    connUserProperties?: Record<string, string | string[]>
    protobufPath?: string
    protobufMessageName?: string
    format?: FormatType
  }

  interface SubscribeOptions extends ConnectOptions {
    topic: string[]
    qos?: QoS[]
    // properties of MQTT 5.0
    no_local?: boolean[]
    retainAsPublished?: boolean[]
    retainHandling?: QoS[]
    subscriptionIdentifier?: number[]
    format?: FormatType
    outputMode?: OutputMode
    verbose: boolean
    connUserProperties?: Record<string, string | string[]>
    protobufPath?: string
    protobufMessageName?: string
  }

  type OmitConnectOptions = Omit<ConnectOptions, 'debug'>

  interface BenchConnectOptions extends OmitConnectOptions {
    count: number
    interval: number
  }

  type OmitPublishOptions = Omit<
    PublishOptions,
    'stdin' | 'multiline' | 'protobufPath' | 'protobufMessageName' | 'format' | 'debug'
  >

  interface BenchPublishOptions extends OmitPublishOptions {
    count: number
    interval: number
    messageInterval: number
    verbose: boolean
  }

  type OmitSubscribeOptions = Omit<
    SubscribeOptions,
    'format' | 'outputMode' | 'protobufPath' | 'protobufMessageName' | 'debug'
  >

  interface BenchSubscribeOptions extends OmitSubscribeOptions {
    count: number
    interval: number
  }

  interface SimulatePubOptions extends BenchPublishOptions {
    scenario: string
    file: string
  }

  interface Simulator {
    name: string
    file: string
    realFilePath: string
    version?: string
    description?: string
    generator: (option: SimulatePubOptions) => {
      topic?: string
      message: string | Buffer
    }
  }

  type Config = {
    [key in CommandType]?:
      | ConnectOptions
      | PublishOptions
      | SubscribeOptions
      | BenchConnectOptions
      | BenchPublishOptions
      | BenchSubscribeOptions
      | SimulatePubOptions
      | Simulator
  }

  interface LsOptions {
    scenarios: boolean
  }
}

export {}
