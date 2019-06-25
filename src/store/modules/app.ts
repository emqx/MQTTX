import { App } from '../../types/index'

const TOGGLE_THEME: string = 'TOGGLE_THEME'
const TOGGLE_LANG: string = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK: string = 'TOGGLE_AUTO_CHECK'

const app = {
  state: {
    currentTheme: localStorage.getItem('currentTheme') || 'light',
    currentLang: localStorage.getItem('currentLang') || 'en',
    autoCheck: JSON.parse(localStorage.getItem('autoCheck') || 'true'),
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
      localStorage.setItem('currentTheme', payload.currentTheme)
      commit(TOGGLE_THEME, payload.currentTheme)
    },
    TOGGLE_LANG({ commit }: any, payload: App) {
      localStorage.setItem('currentLang', payload.currentLang)
      commit(TOGGLE_LANG, payload.currentLang)
    },
    TOGGLE_AUTO_CHECK({ commit }: any, payload: App) {
      localStorage.setItem('autoCheck', JSON.stringify(payload.autoCheck))
      commit(TOGGLE_AUTO_CHECK, payload.autoCheck)
    },
  },
}

export default app
