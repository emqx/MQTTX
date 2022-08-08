import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja'

  type Protocol = 'ws' | 'wss'

  type QoS = 0 | 1 | 2

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex'

  type MessageType = 'all' | 'received' | 'publish'

  type CertType = '' | 'server' | 'self'

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

  interface ChartDataModel {
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

  interface ActiveConnection {
    readonly id: string
  }

  interface Client extends ActiveConnection {
    client: MqttClient | {}
    messages: MessageModel[]
  }

  interface Message extends ActiveConnection {
    message: MessageModel
  }

  interface ClientInfo extends ActiveConnection {
    showClientInfo: boolean
  }

  interface Subscriptions extends ActiveConnection {
    subscriptions: SubscriptionModel[]
  }

  interface UnreadMessage extends ActiveConnection {
    unreadMessageCount?: 0
  }

  interface SubscriptionsVisible {
    showSubscriptions: boolean
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
    showSubscriptions: boolean
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

  type QoSList = [0, 1, 2]

  interface SubscriptionModel {
    topic: string
    alias?: string
    qos: 0 | 1 | 2
    retain?: boolean
    color?: string
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

  // MQTT 5 feature
  interface PushPropertiesModel {
    payloadFormatIndicator?: boolean | null
    messageExpiryInterval?: number | null
    topicAlias?: number | null
    responseTopic?: string | null
    correlationData?: string | Buffer | null
    userProperties?: Object | null
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
    userProperties?: Object | null
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
    userProperties?: Object | null
  }

  interface SSLPath {
    rejectUnauthorized?: boolean
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
    host: string
    port: number
    keepalive: number
    connectTimeout: number
    reconnect: boolean
    username: string
    password: string
    path: string
    certType?: CertType
    ssl: boolean
    mqttVersion: '3.1.1' | '5.0'
    unreadMessageCount: number
    messages: MessageModel[]
    subscriptions: SubscriptionModel[]
    client:
      | MqttClient
      | {
          connected: boolean
        }
    will?: WillModel
    properties?: ClientPropertiesModel
  }
}
