import { TranslateResult } from 'vue-i18n'

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

export {
  App,
  State,
  Routes,
  Options,
}
