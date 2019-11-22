import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'
import { MqttClient } from 'mqtt'
import { MessageModel } from '@/views/connections/types'

declare global {
  type VueForm = Vue & {
    validate: (validate: (valid: boolean) => void) => void,
    clearValidate: () => void,
    resetFields: () => void,
  }

  interface ActiveConnection {
    readonly id: string,
  }

  interface Client extends ActiveConnection {
    client: MqttClient | {},
    messages: MessageModel[],
  }

  interface Message extends ActiveConnection {
    message: MessageModel,
  }

  interface ClientInfo extends ActiveConnection {
    showClientInfo: boolean,
  }

  interface Subscriptions extends ActiveConnection {
    subscriptions: SubscriptionModel[],
  }

  interface UnreadMessage extends ActiveConnection {
    unreadMessageCount?: 0,
  }

  interface SubscriptionsVisible {
    showSubscriptions: boolean
  }
}

declare global {
  type $TSFixed = any

  type PluginFunction<T> = (Vue: any, options?: T) => void

  interface PluginObject<T> {
    install: PluginFunction<T>
    [key: string]: any
  }

  interface App {
    currentTheme: 'light' | 'dark' | 'purple',
    currentLang: 'en' | 'zh',
    MacOSTop: '24px' | '0px',
    autoCheck: boolean,
    showSubscriptions: boolean,
    showClientInfo: {
      [id: string]: boolean,
    },
    unreadMessageCount: {
      [id: string]: number,
    }
    activeConnection: {
      [id: string]: {
        client: MqttClient | {},
        messages: MessageModel[],
        subscriptions?: SubscriptionModel[],
      },
    },
  }

  interface State {
    app: App,
  }

  interface Routes {
    path: string,
    component: any,
    name: string,
    redirect?: string,
    children?: Routes[],
  }

  interface Options {
    value: any,
    label: string | TranslateResult,
    children?: Options[],
    disabled?: boolean,
  }

  interface SubscriptionModel {
    topic: string,
    qos: 0 | 1 | 2,
    retain?: boolean,
  }

  type qosList = [0, 1, 2]
}
