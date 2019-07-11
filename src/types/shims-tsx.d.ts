import Vue, { VNode } from 'vue'
import { TranslateResult } from 'vue-i18n'

declare global {
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any
    }
  }

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
    redirect: string,
    children: any[],
  }

  interface Options {
    value: any,
    label: string | TranslateResult,
  }
}
