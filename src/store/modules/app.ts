import Vue from 'vue'
import { MqttClient } from 'mqtt'
import { loadSettings, setSettings } from '@/utils/api/setting'

interface ActiveConnection {
  id: string,
}

interface Client extends ActiveConnection {
  client: MqttClient,
}

interface ClientInfo extends ActiveConnection {
  showClientInfo: boolean,
}

interface Subscriptions extends ActiveConnection {
  subscriptions: SubscriptionModel[],
}

interface UnreadMessage extends ActiveConnection {
  unreadMessageCount: 0,
}

interface SubscriptionsVisible {
  showSubscriptions: boolean
}

const TOGGLE_THEME: string = 'TOGGLE_THEME'
const TOGGLE_LANG: string = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK: string = 'TOGGLE_AUTO_CHECK'
const CHANGE_ACTIVE_CONNECTION: string = 'CHANGE_ACTIVE_CONNECTION'
const REMOVE_ACTIVE_CONNECTION: string = 'REMOVE_ACTIVE_CONNECTION'
const CHANGE_SUBSCRIPTIONS: string = 'CHANGE_SUBSCRIPTIONS'
const SHOW_CLIENT_INFO: string = 'SHOW_CLIENT_INFO'
const SHOW_SUBSCRIPTIONS: string = 'SHOW_SUBSCRIPTIONS'
const UNREAD_MESSAGE_COUNT_INCREMENT: string = 'UNREAD_MESSAGE_COUNT_INCREMENT'

const stateRecord: App = loadSettings()

const getShowSubscriptions = (): boolean => {
  const $showSubscriptions: string | null = localStorage.getItem('showSubscriptions')
  if (!$showSubscriptions) {
    return true
  }
  return JSON.parse($showSubscriptions)
}

const app = {
  state: {
    currentTheme: stateRecord.currentTheme || 'light',
    currentLang: stateRecord.currentLang || 'en',
    autoCheck: stateRecord.autoCheck,
    showSubscriptions: getShowSubscriptions(),
    showClientInfo: {},
    unreadMessageCount: {},
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
      delete state.unreadMessageCount[id]
      delete state.showClientInfo[id]
    },
    [CHANGE_SUBSCRIPTIONS](state: App, subs: Subscriptions) {
      state.activeConnection[subs.id].subscriptions = subs.subscriptions
    },
    [SHOW_CLIENT_INFO](state: App, payload: ClientInfo) {
      state.showClientInfo[payload.id] = payload.showClientInfo
    },
    [SHOW_SUBSCRIPTIONS](state: App, payload: SubscriptionsVisible) {
      state.showSubscriptions = payload.showSubscriptions
      localStorage.setItem('showSubscriptions', JSON.stringify(state.showSubscriptions))
    },
    [UNREAD_MESSAGE_COUNT_INCREMENT](state: App, payload: UnreadMessage) {
      if (payload.unreadMessageCount !== undefined) {
        Vue.set(state.unreadMessageCount, payload.id, payload.unreadMessageCount)
      } else {
        const count = state.unreadMessageCount[payload.id] += 1
        Vue.set(state.unreadMessageCount, payload.id, count)
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
    SHOW_CLIENT_INFO({ commit }: any, payload: App) {
      commit(SHOW_CLIENT_INFO, payload)
    },
    SHOW_SUBSCRIPTIONS({ commit }: any, payload: App) {
      commit(SHOW_SUBSCRIPTIONS, payload)
    },
    UNREAD_MESSAGE_COUNT_INCREMENT({ commit }: any, payload: App) {
      commit(UNREAD_MESSAGE_COUNT_INCREMENT, payload)
    },
  },
}

export default app
