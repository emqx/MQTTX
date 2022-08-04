import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'
import { MessageModel, ConnectionModel } from '@/views/connections/types'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja'

  type Protocol = 'ws' | 'wss'

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex'

  type MessageType = 'all' | 'received' | 'publish'

  type VueForm = Vue & {
    validate: (validate: (valid: boolean) => void) => void
    clearValidate: () => void
    resetFields: () => void
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

  type QoSList = [0, 1, 2]

  interface SubscriptionModel {
    topic: string
    alias?: string
    qos: 0 | 1 | 2
    retain?: boolean
    color?: string
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
}
