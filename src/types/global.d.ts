import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja' | 'tr' | 'hu'

  type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex'

  type QoS = 0 | 1 | 2

  type RetainHandling = 0 | 1 | 2

  type QoSList = [0, 1, 2]

  type RetainHandlingList = [0, 1, 2]

  type ProtocolMap = {
    [key in ProtocolOption]: string
  }

  type CertType = '' | 'server' | 'self'

  type MqttVersion = '3.1.1' | '5.0'

  enum ProtocolOption {
    ws = 'ws',
    wss = 'wss',
    mqtt = 'mqtt',
    mqtts = 'mqtts',
  }

  type MessageType = 'all' | 'received' | 'publish'

  type UserPropsPairObject = { key: string; value: string; checked: boolean }

  // Vue
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

  interface Options {
    value: any
    label: string | TranslateResult
    children?: Options[]
    disabled?: boolean
  }

  type SearchCallBack = (data: ConnectionModel[]) => ConnectionModel[]

  type NameCallBack = (name: string) => string

  // Vuex state
  interface ActiveConnection {
    [id: string]: {
      client: MqttClient
      messages: MessageModel[]
      subscriptions?: SubscriptionModel[]
    }
  }
  interface App {
    currentTheme: Theme
    currentLang: Language
    autoCheck: boolean
    autoResub: boolean
    autoScroll: boolean
    showSubscriptions: boolean
    maxReconnectTimes: number
    showClientInfo: {
      [id: string]: boolean
    }
    unreadMessageCount: {
      [id: string]: number
    }
    activeConnection: ActiveConnection
    willMessageVisible: boolean
    advancedVisible: boolean
    allConnections: ConnectionModel[]
    currentScript: ScriptState | null
    connectionTreeState: ConnectionTreeStateMap
  }

  interface State {
    app: App
  }

  // Routes
  interface Routes {
    path: string
    component: any
    name: string
    redirect?: string
    children?: Routes[]
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

  interface SubscriptionsVisible {
    showSubscriptions: boolean
  }

  interface SubscriptionModel {
    id?: string
    topic: string
    qos: QoS
    alias?: string
    retain?: boolean
    color?: string
    createAt: string
    // MQTT 5.0 only
    nl?: boolean
    rap?: boolean
    rh?: RetainHandling
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

  interface SSLPath {
    rejectUnauthorized?: boolean
    ca: string
    cert: string
    key: string
  }

  // MQTT 5 feature
  interface WillPropertiesModel {
    willDelayInterval?: number
    payloadFormatIndicator?: boolean
    messageExpiryInterval?: number
    contentType?: string
    responseTopic?: string
    correlationData?: Buffer
    userProperties?: Object
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
    resubscribe?: boolean
    username: string
    password: string
    path: string
    certType?: CertType
    ssl: boolean
    mqttVersion: string
    unreadMessageCount: number
    messages: MessageModel[]
    subscriptions: SubscriptionModel[]
    will?: WillModel
    clientIdWithTime?: boolean
    parentId?: string | null
    isCollection: false
    orderId?: number
    properties?: ClientPropertiesModel
  }

  // MQTT 5 feature
  interface ClientPropertiesModel {
    sessionExpiryInterval?: number
    receiveMaximum?: number
    maximumPacketSize?: number
    topicAliasMaximum?: number
    requestResponseInformation?: boolean
    requestProblemInformation?: boolean
    userProperties?: Object
    authenticationMethod?: string
    authenticationData?: Buffer
  }

  interface PushOptions {
    qos?: QoS
    retain?: boolean
    dup?: boolean
    properties?: PushPropertiesModel
  }

  // MQTT 5 feature
  interface PushPropertiesModel {
    payloadFormatIndicator?: boolean
    messageExpiryInterval?: number
    topicAlias?: number
    responseTopic?: string
    correlationData?: Buffer
    userProperties?: Object
    subscriptionIdentifier?: number
    contentType?: string
  }

  interface CollectionModel {
    readonly id: string
    name: string
    children: ConnectionModelTree[]
    isCollection: true
    isEdit?: boolean
    orderId?: number
    isNewing?: boolean
  }

  type ConnectionModelTree = CollectionModel | ConnectionModel

  interface SSLContent {
    ca: string | string[] | Buffer | Buffer[] | undefined
    cert: string | string[] | Buffer | Buffer[] | undefined
    key: string | string[] | Buffer | Buffer[] | undefined
  }

  interface ConnectionTreeState {
    id: string
    expanded: boolean
  }

  interface ConnectionTreeStateMap {
    [id: string]: {
      expanded: boolean
    }
  }

  // Scripts
  interface ScriptModel {
    id?: string
    name: string
    script: string
  }

  interface ScriptState {
    apply: MessageType
    content: ScriptModel | null
  }

  interface SettingModel {
    autoCheck?: boolean
    currentLang?: Language
    currentTheme?: Theme
    maxReconnectTimes?: number
    autoResub?: boolean
  }
}
