import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja'

  type Protocol = 'ws' | 'wss'

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex'

  type QoS = 0 | 1 | 2

  type QoSList = [0, 1, 2]

  type RetainHandling = 0 | 1 | 2

  type RetainHandlingList = [0, 1, 2]

  type MessageType = 'all' | 'received' | 'publish'

  type CertType = '' | 'server' | 'self'

  type MqttVersion = '3.1.1' | '5.0'

  enum ProtocolOption {
    ws = 'ws',
    wss = 'wss',
  }

  type ProtocolMap = {
    [key in ProtocolOption]: string
  }

  type VueForm = Vue & {
    validate: (validate: (valid: boolean) => void) => void
    clearValidate: () => void
    resetFields: () => void
  }

  interface FormRule {
    field: string
    fullField: string
    type: string
    validator: () => void
  }

  interface MetricsModel {
    label: string
    recevied: number
    sent: number
  }

  // System
  interface ContextmenuModel {
    top: number
    left: number
  }

  type EditorRef = Vue & {
    editorLayout: () => void
  }

  // Vuex state
  interface ActiveConnection {
    [id: string]: {
      client: MqttClient
      messages: MessageModel[]
      subscriptions?: SubscriptionModel[]
    }
  }

  // Connections
  interface Client {
    readonly id: string
    client: Partial<MqttClient>
    messages: MessageModel[]
  }

  interface Message {
    readonly id: string
    message: MessageModel
  }

  interface ClientInfo {
    readonly id: string
    showClientInfo: boolean
  }

  interface Subscriptions {
    readonly id: string
    subscriptions: SubscriptionModel[]
  }

  interface UnreadMessage {
    readonly id: string
    unreadMessageCount?: 0
  }

  type PluginFunction<T> = (Vue: any, options?: T) => void

  interface PluginObject<T> {
    install: PluginFunction<T>
    [key: string]: any
  }

  interface App {
    currentTheme: Theme
    currentLang: Language
    autoCheck: boolean
    autoResub: boolean
    autoScroll: boolean
    autoScrollInterval: number
    multiTopics: boolean
    maxReconnectTimes: number
    showClientInfo: {
      [id: string]: boolean
    }
    unreadMessageCount: {
      [id: string]: number
    }
    activeConnection: {
      [id: string]: {
        client: MqttClient | {}
        messages: MessageModel[]
        subscriptions?: SubscriptionModel[]
      }
    }
    willMessageVisible: boolean
    advancedVisible: boolean
    allConnections: ConnectionModel[] | []
  }

  interface State {
    app: App
  }

  interface Routes {
    path: string
    component: any
    name: string
    redirect?: string
    children?: Routes[]
  }

  interface Options {
    value: any
    label: string | TranslateResult
    children?: Options[]
    disabled?: boolean
  }

  type SearchCallBack = (data: ConnectionModel[]) => ConnectionModel[]

  type NameCallBack = (name: string) => string

  interface SubscriptionModel {
    id?: string
    topic: string
    qos: QoS
    disabled: boolean
    alias?: string
    retain?: boolean
    color?: string
    createAt: string
    // MQTT 5.0 only
    nl?: boolean
    rap?: boolean
    rh?: RetainHandling
    subscriptionIdentifier?: number | null
  }

  interface MessageModel {
    id?: string
    createAt: string
    out: boolean
    payload: string
    qos: QoS
    retain: boolean
    topic: string
    color?: string
    properties?: PushPropertiesModel
  }

  interface HistoryMessageHeaderModel {
    connectionId?: string
    id?: string
    retain: boolean
    topic: string
    qos: QoS
    createAt?: string
  }

  interface HistoryMessagePayloadModel {
    connectionId?: string
    id?: string
    payload: string
    payloadType: PayloadType
    createAt?: string
  }

  // MQTT 5 feature
  interface PushPropertiesModel {
    payloadFormatIndicator?: boolean | null
    messageExpiryInterval?: number | null
    topicAlias?: number | null
    responseTopic?: string | null
    correlationData?: string | Buffer | null
    userProperties?: { [key: string]: string | string[] } | null
    subscriptionIdentifier?: number | null
    contentType?: string | null
  }

  // MQTT 5 feature
  interface ClientPropertiesModel {
    sessionExpiryInterval?: number | null
    receiveMaximum?: number | null
    maximumPacketSize?: number | null
    topicAliasMaximum?: number | null
    requestResponseInformation?: boolean | null
    requestProblemInformation?: boolean | null
    userProperties?: { [key: string]: string | string[] } | null
    authenticationMethod?: string | null
    authenticationData?: Buffer | null
  }

  // MQTT 5 feature
  interface WillPropertiesModel {
    willDelayInterval?: number | null
    payloadFormatIndicator?: boolean | null
    messageExpiryInterval?: number | null
    contentType?: string | null
    responseTopic?: string | null
    correlationData?: string | Buffer | null
    userProperties?: { [key: string]: string | string[] } | null
  }

  interface SSLPath {
    rejectUnauthorized?: boolean
    ALPNProtocols?: string | null
    ca: string
    cert: string
    key: string
  }

  interface SSLContent {
    ca: string | string[] | Buffer | Buffer[] | undefined
    cert: string | string[] | Buffer | Buffer[] | undefined
    key: string | string[] | Buffer | Buffer[] | undefined
  }

  interface WillModel {
    id?: string
    lastWillTopic: string
    lastWillPayload: string
    lastWillQos: QoS
    lastWillRetain: boolean
    properties?: WillPropertiesModel
  }

  interface ConnectionModel extends SSLPath {
    readonly id?: string
    clientId: string
    name: string
    clean: boolean
    protocol?: Protocol
    createAt: string
    updateAt: string
    host: string
    port: number
    keepalive: number
    connectTimeout: number
    reconnect: boolean
    reconnectPeriod: number
    username: string
    password: string
    path: string
    certType?: CertType
    ssl: boolean
    mqttVersion: MqttVersion
    unreadMessageCount: number
    messages: MessageModel[]
    pushProps: PushPropertiesModel
    subscriptions: SubscriptionModel[]
    client:
      | MqttClient
      | {
          connected: boolean
        }
    will?: WillModel
    properties?: ClientPropertiesModel
    clientIdWithTime?: boolean
  }
}
