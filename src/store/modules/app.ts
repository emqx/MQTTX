import { loadSettings, setSettings } from '@/utils/api/setting'
import { MqttClient } from 'mqtt'

interface Connection {
  id: string,
  client: MqttClient,
}

const TOGGLE_THEME: string = 'TOGGLE_THEME'
const TOGGLE_LANG: string = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK: string = 'TOGGLE_AUTO_CHECK'
const CHANGE_ACTIVE_CONNECTION: string = 'CHANGE_ACTIVE_CONNECTION'
const REMOVE_ACTIVE_CONNECTION: string = 'REMOVE_ACTIVE_CONNECTION'

const stateRecord: App = loadSettings()

const app = {
  state: {
    currentTheme: stateRecord.currentTheme || 'light',
    currentLang: stateRecord.currentLang || 'en',
    autoCheck: stateRecord.autoCheck,
    activeConnection: {},
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
    [CHANGE_ACTIVE_CONNECTION](state: App, connection: Connection) {
      const client: MqttClient = connection.client
      state.activeConnection[connection.id] = {
        client,
      }
    },
    [REMOVE_ACTIVE_CONNECTION](state: App, id: string) {
      delete state.activeConnection[id]
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
    CHANGE_ACTIVE_CONNECTION({ commit }: any, payload: App) {
      commit(CHANGE_ACTIVE_CONNECTION, payload)
    },
    REMOVE_ACTIVE_CONNECTION({ commit }: any, { id }: { id: string }) {
      commit(REMOVE_ACTIVE_CONNECTION, id)
    },
  },
}

export default app
