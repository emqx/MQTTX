import { loadSettings, setSettings } from '@/utils/api/setting'

const TOGGLE_THEME: string = 'TOGGLE_THEME'
const TOGGLE_LANG: string = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK: string = 'TOGGLE_AUTO_CHECK'

const stateRecord: App = loadSettings()

const app = {
  state: {
    currentTheme: stateRecord.currentTheme || 'light',
    currentLang: stateRecord.currentLang || 'en',
    autoCheck: stateRecord.autoCheck,
  },
  mutations: {
    [TOGGLE_THEME](state: App, currentTheme: string) {
      state.currentTheme = currentTheme
    },
    [TOGGLE_LANG](state: App, currentLang: string) {
      state.currentLang = currentLang
    },
    [TOGGLE_AUTO_CHECK](state: App, autoCheck: boolean) {
      state.autoCheck = autoCheck
    },
  },
  actions: {
    TOGGLE_THEME({ commit }: any, payload: App) {
      setSettings('settings.currentTheme', payload.currentTheme)
      commit(TOGGLE_THEME, payload.currentTheme)
    },
    TOGGLE_LANG({ commit }: any, payload: App) {
      setSettings('settings.currentLang', payload.currentLang)
      commit(TOGGLE_LANG, payload.currentLang)
    },
    TOGGLE_AUTO_CHECK({ commit }: any, payload: App) {
      setSettings('settings.autoCheck', payload.autoCheck)
      commit(TOGGLE_AUTO_CHECK, payload.autoCheck)
    },
  },
}

export default app
