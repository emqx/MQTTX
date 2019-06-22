import { App } from '../../types/index'

const TOGGLE_THEME: string = 'TOGGLE_THEME'

const app = {
  state: {
    currentTheme: localStorage.getItem('currentTheme') || 'light',
  },
  mutations: {
    [TOGGLE_THEME](state: App, currentTheme: string) {
      state.currentTheme = currentTheme
    },
  },
  actions: {
    TOGGLE_THEME({ commit }: any, payload: App) {
      localStorage.setItem('currentTheme', payload.currentTheme)
      commit(TOGGLE_THEME, payload.currentTheme)
    },
  },
}

export default app
