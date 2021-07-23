import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja' | 'tr'

  type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex'

  type QoS = 0 | 1 | 2

  type QoSList = [0, 1, 2]

  type ProtocolMap = {
    [key in ProtocolOption]: string
  }

  type searchCallBack = (data: ConnectionModel[]) => ConnectionModel[]

  type nameCallBack = (name: string) => string

  enum ProtocolOption {
    ws = 'ws',
    wss = 'wss',
    mqtt = 'mqtt',
    mqtts = 'mqtts',
  }

  type MessageType = 'all' | 'received' | 'publish'

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

  interface SearchCallBack {
    callBack: searchCallBack
  }

  interface NameCallBack {
    callBack: nameCallBack
  }

  // Vuex state
  interface App {
    currentTheme: Theme
    currentLang: Language
    autoCheck: boolean
    autoResub: boolean
    showSubscriptions: boolean
    maxReconnectTimes: number
    showClientInfo: {
      [id: string]: boolean
    }
    unreadMessageCount: {
      [id: string]: number
    }
    connectionCollection: ConnectionModelCollection[]
    activeConnection: {
      [id: string]: {
        client: MqttClient | {}
        messages: MessageModel[]
        subscriptions?: SubscriptionModel[]
      }
    }
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

  interface SubscriptionModel {
    topic: string
    qos: QoS
    alias?: string
    retain?: boolean
    color?: string
  }

  interface MessageModel {
    mid: string
    createAt: string
    out: boolean
    payload: string
    qos: QoS
    retain: boolean
    topic: string
  }

  interface HistoryMessageHeaderModel {
    connectionId?: string
    id?: string
    retain: boolean
    topic: string
    qos: QoS
  }

  interface HistoryMessagePayloadModel {
    connectionId?: string
    id?: string
    payload: string
    payloadType: PayloadType
  }

  interface SSLPath {
    rejectUnauthorized?: boolean
    ca: string
    cert: string
    key: string
  }

  interface WillPropertiesModel {
    willDelayInterval?: number
    payloadFormatIndicator?: boolean
    messageExpiryInterval?: number
    contentType?: string
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
    certType?: '' | 'server' | 'self'
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
    sessionExpiryInterval?: number
    receiveMaximum?: number
    topicAliasMaximum?: number
    requestResponseInformation?: boolean
    requestProblemInformation?: boolean
    will?: {
      lastWillTopic: string
      lastWillPayload: string
      lastWillQos: QoS
      lastWillRetain: boolean
      properties?: WillPropertiesModel
    }
    clientIdWithTime?: boolean // fill in client_id.Ensure that client_id field is unique.
    collectionId?: string | null // if collection is null set to default
    isCollection: false
    orderId?: number
  }

  interface ConnectionModelCollection {
    readonly id: string
    name: string
    children: ConnectionModelTree[]
    isCollection: true
    isEdit?: boolean
    orderId?: number
  }

  // leaf: ConnectionModel | collection: ConnectionModelCollection
  type ConnectionModelTree = ConnectionModelCollection | ConnectionModel

  interface SSLContent {
    ca: string | string[] | Buffer | Buffer[] | undefined
    cert: string | string[] | Buffer | Buffer[] | undefined
    key: string | string[] | Buffer | Buffer[] | undefined
  }

  enum SubscribeErrorReason {
    normal,
    qosSubFailed, // qos is abnormal
    qosSubSysFailed, // qos is abnormal becauseof $SYS subscribe
    emptySubFailed, // subscription returns empty array
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
}
