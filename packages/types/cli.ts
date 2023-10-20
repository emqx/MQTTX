import { MQTTVersion, Protocol, QoS } from './base'

export type CommandType = 'conn' | 'pub' | 'sub' | 'benchConn' | 'benchPub' | 'benchSub' | 'simulate'

export type FormatType = 'base64' | 'json' | 'hex'

export type OutputMode = 'clean' | 'default'

export interface ConnectOptions {
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
}

export interface PublishOptions extends ConnectOptions {
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

export interface SubscribeOptions extends ConnectOptions {
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

export interface BenchConnectOptions extends ConnectOptions {
  count: number
  interval: number
}

export type OmitPublishOptions = Omit<
  PublishOptions,
  'stdin' | 'multiline' | 'protobufPath' | 'protobufMessageName' | 'format'
>

export interface BenchPublishOptions extends OmitPublishOptions {
  count: number
  interval: number
  messageInterval: number
  verbose: boolean
}

export type OmitSubscribeOptions = Omit<
  SubscribeOptions,
  'format' | 'outputMode' | 'protobufPath' | 'protobufMessageName'
>

export interface BenchSubscribeOptions extends OmitSubscribeOptions {
  count: number
  interval: number
}

export interface SimulatePubOptions extends BenchPublishOptions {
  scenario: string
  file: string
}

export interface Simulator {
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

export type Config = {
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

export interface LsOptions {
  scenarios: boolean
}
