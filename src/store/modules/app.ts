import { loadSettings, setSettings } from '@/utils/api/setting'
import { loadConnection } from '@/utils/api/connection'
import { MqttClient } from 'mqtt'
import { MessageModel } from '@/views/connections/types'

interface Client {
  id: string,
  client: MqttClient,
}

interface Subscriptions {
  id: string,
  subscriptions: SubscriptionModel[],
}

interface Message {
  id: string,
  messages: MessageModel[]
}

const TOGGLE_THEME: string = 'TOGGLE_THEME'
const TOGGLE_LANG: string = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK: string = 'TOGGLE_AUTO_CHECK'
const CHANGE_ACTIVE_CONNECTION: string = 'CHANGE_ACTIVE_CONNECTION'
const REMOVE_ACTIVE_CONNECTION: string = 'REMOVE_ACTIVE_CONNECTION'
const CHANGE_SUBSCRIPTIONS: string = 'CHANGE_SUBSCRIPTIONS'
const PUSH_MESSAGE: string = 'PUSH_MESSAGE'

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
    [CHANGE_ACTIVE_CONNECTION](state: App, connection: Client) {
      const client: MqttClient = connection.client
      if (state.activeConnection[connection.id]) {
        state.activeConnection[connection.id].client = client
      } else {
        state.activeConnection[connection.id] = {
          client,
        }
      }
    },
    [REMOVE_ACTIVE_CONNECTION](state: App, id: string) {
      delete state.activeConnection[id]
    },
    [CHANGE_SUBSCRIPTIONS](state: App, subs: Subscriptions) {
      state.activeConnection[subs.id].subscriptions = subs.subscriptions
    },
    [PUSH_MESSAGE](state: App, payload: Message) {
      const currentConnection = loadConnection(payload.id)
      if (!state.activeConnection[payload.id].messages) {
        state.activeConnection[payload.id].messages = currentConnection.messages
      } else {
        state.activeConnection[payload.id].messages = payload.messages
      }
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
    CHANGE_SUBSCRIPTIONS({ commit }: any, payload: App) {
      commit(CHANGE_SUBSCRIPTIONS, payload)
    },
    PUSH_MESSAGE({ commit }: any, payload: App) {
      commit(PUSH_MESSAGE, payload)
    },
  },
}

export default app
