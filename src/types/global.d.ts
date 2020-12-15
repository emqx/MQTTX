import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'
import { MessageModel, ConnectionModel } from '@/views/connections/types'
import { ScriptState } from '@/views/script/types'

declare global {
  type $TSFixed = any

  type Theme = 'light' | 'dark' | 'night'

  type Language = 'zh' | 'en' | 'ja'

  type Protocol = 'ws' | 'wss' | 'mqtt' | 'mqtts'

  type PayloadType = 'Plaintext' | 'Base64' | 'JSON' | 'Hex'

  type VueForm = Vue & {
    validate: (validate: (valid: boolean) => void) => void
    clearValidate: () => void
    resetFields: () => void
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
    currentScript: ScriptState | null
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
}
