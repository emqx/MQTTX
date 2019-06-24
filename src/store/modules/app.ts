import { App } from '../../types/index'

const TOGGLE_THEME: string = 'TOGGLE_THEME'
const TOGGLE_LANG: string = 'TOGGLE_LANG'

const app = {
  state: {
    currentTheme: localStorage.getItem('currentTheme') || 'light',
    currentLang: localStorage.getItem('currentLang') || 'en',
  },
  mutations: {
    [TOGGLE_THEME](state: App, currentTheme: string) {
      state.currentTheme = currentTheme
    },
    [TOGGLE_LANG](state: App, currentLang: string) {
      state.currentLang = currentLang
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
  },
}

export default app
