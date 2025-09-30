import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { IPublishPacket, MqttClient } from 'mqtt'
import type { AIModel } from '@/utils/ai/copilot'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja' | 'tr' | 'hu'

  type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex' | 'CBOR' | 'MsgPack'

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

  interface MetricsModel {
    label: string
    received: number
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
      subscriptions?: SubscriptionModel[]
    }
  }
  interface App {
    currentTheme: Theme
    currentLang: Language
    autoCheck: boolean
    autoResub: boolean
    syncOsTheme: boolean
    multiTopics: boolean
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
    currentConnectionId: string | null
    connectionTreeState: ConnectionTreeStateMap
    jsonHighlight: boolean
    enableCopilot: boolean
    openAIAPIHost: string
    openAIAPIKey: string
    model: AIModel
    isPrismButtonAdded: boolean
    logLevel: LogLevel
    showConnectionList: boolean
    connectDatabaseFailMessage: string
    ignoreQoS0Message: boolean
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
    increasedCount?: number
  }

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
    meta?: string
  }

  interface MessagePaginationModel {
    list: MessageModel[]
    total: number
    publishedTotal: number
    receivedTotal: number
    limit: number
    page: number
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
    payloadType: string
    createAt?: string
  }

  interface SSLPath {
    rejectUnauthorized?: boolean
    ALPNProtocols?: string | null
    ca: string
    cert: string
    key: string
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

  interface PushOptions {
    qos?: QoS
    retain?: boolean
    dup?: boolean
    properties?: PushPropertiesModel
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
  // TODO: split this
  interface ScriptModel {
    id?: string
    name: string
    script: string
    type?: string | null
  }

  interface FunctionModel {
    id?: string
    name: string
    script: string
    type?: string | null
  }

  interface SchemaModel {
    id?: string
    name: string
    rawSchema: string
    type: SchemaType
  }

  // TODO: split this
  interface ScriptState {
    apply: MessageType
    function?: ScriptModel | null
    schema?: ScriptModel | null
    // config of function/schema
    config?: {
      // protobuf name
      name?: string
    }
  }

  interface FunctionState {
    function: ScriptModel | null
  }

  interface ProtobufSchema {
    type: 'protobuf'
    schema: SchemaModel | null
    protobufMsgName: string
  }

  interface AvroSchema {
    type: 'avro'
    schema: SchemaModel | null
  }

  type SchemaState = {
    apply: MessageType
    schemaOptions: ProtobufSchema | AvroSchema
  }

  interface SettingModel {
    autoCheck?: boolean
    currentLang?: Language
    currentTheme?: Theme
    maxReconnectTimes?: number
    autoResub?: boolean
  }

  type SchemaType = 'protobuf' | 'avro'
  type FunctionType = 'javascript'
  interface SchemaList {
    label: string
    value: SchemaType
  }
  interface FunctionList {
    label: string
    value: FunctionType
  }

  interface ImportScriptForm {
    filePath: string
    fileName: string
    fileContent: string
  }

  type CopilotRole = 'user' | 'system' | 'assistant'
  interface CopilotMessage {
    id: string
    role: CopilotRole
    content: string
    createAt?: string
  }

  interface AreaLineSeriesData {
    xData: string[]
    seriesData: {
      name: string
      areaStyle: {
        colorFrom: string
        colorTo: string
      }
      data: any[]
    }[]
  }

  type LogLevel = 'debug' | 'info' | 'warn' | 'error'

  interface TopicTreeNode {
    id: string
    label: string
    messageCount: number
    subTopicCount: number
    message?: MessageModel
    connectionInfo?: ConnectionModel
    parentId?: string
    children?: TopicTreeNode[]
  }

  interface UpdateTopicNodeResult {
    updatedTree: TopicTreeNode[]
    updatedNode: TopicTreeNode | null
  }

  interface TopicNodeStats {
    msgTopic: string
    msgCount: number
    lastTime: string
    latestMessage?: MessageModel
  }

  interface QueuedMessage {
    connectionId: string
    updateNodes: TopicTreeNode[]
    timestamp: number
  }

  interface EChartsTreeNode extends TopicTreeNode {
    name: string
    lastMessage?: string
    data?: TopicTreeNode
    children?: EChartsTreeNode[]
  }
  interface DashboardModel {
    id: string
    name: string
    description?: string
    orderId?: number
    globalSettings?: any
    widgets: WidgetModel[]
    createAt: string
    updateAt: string
  }

  type WidgetType = 'Big Number' | 'Gauge' | 'Line'
  interface WidgetModel {
    id?: string
    type: WidgetType
    title?: string

    x: number
    y: number
    w: number
    h: number
    static?: boolean
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number

    dashboardId: string

    connectionId?: string
    topicPattern?: string
    valueField?: string
    fallbackValue: number

    schemaType?: 'protobuf' | 'avro'
    schemaId?: string
    schemaMessageName?: string

    // Schema validation state tracking
    schemaValidationState?: 'valid' | 'invalid'
    schemaValidationError?: string

    widgetOptions?: GaugeWidgetOptions | BigNumberWidgetOptions | LineWidgetOptions

    createAt?: string
    updateAt?: string
  }
  interface GaugeWidgetOptions {
    thresholdsType?: 'Absolute' | 'Percentage'
    min?: number
    max?: number
    thresholds?: Threshold[]
    decimals?: number
    unit?: string
    color?: string
  }
  interface BigNumberWidgetOptions {
    thresholdsType?: 'Absolute' | 'Percentage'
    thresholds?: Threshold[]
    min?: number
    max?: number
    decimals?: number
    unit?: string
    color?: string
  }
  interface LineWidgetOptions {
    thresholdsType?: 'Absolute' | 'Percentage'
    thresholds?: Threshold[]
    smooth?: boolean
    area?: boolean
    color?: string
  }
  interface Threshold {
    value: number
    color: string
  }

  interface TimeSeriesDataPoint {
    timestamp: string
    values: { [fieldName: string]: any }
    topic: string
    connectionId: string
    metadata: { qos: QoS; retain: boolean }
  }

  interface BigNumberData {
    value: number | null
    fieldName?: string
    chartData: {
      xData: string[]
      seriesData: [
        {
          name: string
          data: number[]
        },
      ]
    }
  }
  interface GaugeData {
    value: number | null
    fieldName?: string
  }
  interface LineData {
    chartData: {
      xData: string[]
      seriesData: [
        {
          name: string
          data: number[]
        },
      ]
    }
  }
}
