import Vue from 'vue'
import { TranslateResult } from 'vue-i18n'

declare global {
  type VueForm = Vue & {
    validate: (validate: (valid: boolean) => void) => void,
    clearValidate: () => void,
    resetFields: () => void,
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
    currentTheme: string,
    currentLang: string,
    autoCheck: boolean,
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
  }

  interface SubscriptionModel {
    topic: string,
    qos: 0 | 1 | 2,
  }

  type qosList = [0, 1, 2]
}
