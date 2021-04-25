import Vue from 'vue'
import { ConnectionModel, ConnectionModelCollection, ConnectionTreeState } from '../../views/connections/types'
import { loadSettings, setSettings } from '@/api/setting'
import { ScriptState } from '@/views/script/types'

const TOGGLE_THEME = 'TOGGLE_THEME'
const TOGGLE_LANG = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK = 'TOGGLE_AUTO_CHECK'
const SET_MAX_RECONNECT_TIMES = 'SET_MAX_RECONNECT_TIMES'
const CHANGE_ACTIVE_CONNECTION = 'CHANGE_ACTIVE_CONNECTION'
const REMOVE_ACTIVE_CONNECTION = 'REMOVE_ACTIVE_CONNECTION'
const CHANGE_SUBSCRIPTIONS = 'CHANGE_SUBSCRIPTIONS'
const SHOW_CLIENT_INFO = 'SHOW_CLIENT_INFO'
const SHOW_SUBSCRIPTIONS = 'SHOW_SUBSCRIPTIONS'
const UNREAD_MESSAGE_COUNT_INCREMENT = 'UNREAD_MESSAGE_COUNT_INCREMENT'
const SET_CONNECTIONS_TREE = 'SET_CONNECTIONS_TREE'
const TOGGLE_WILL_MESSAGE_VISIBLE = 'TOGGLE_WILL_MESSAGE_VISIBLE'
const TOGGLE_ADVANCED_VISIBLE = 'TOGGLE_ADVANCED_VISIBLE'
const CHANGE_ALL_CONNECTIONS = 'CHANGE_ALL_CONNECTIONS'
const SET_SCRIPT = 'SET_SCRIPT'
const CHANGE_CONNECTION_COLLECTION = 'CHANGE_CONNECTION_COLLECTION'

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
    maxReconnectTimes: stateRecord.maxReconnectTimes || 10,
    showSubscriptions: getShowSubscriptions(),
    showClientInfo: {},
    unreadMessageCount: {},
    connectionTreeState: {},
    activeConnection: {},
    advancedVisible: true,
    willMessageVisible: true,
    allConnections: [],
    currentScript: null,
    connectionCollection: [],
  },
  mutations: {
    [CHANGE_CONNECTION_COLLECTION](state: App, payload: ConnectionModelCollection[] | []) {
      state.connectionCollection = payload
    },
    [TOGGLE_THEME](state: App, currentTheme: Theme) {
      state.currentTheme = currentTheme
    },
    [TOGGLE_LANG](state: App, currentLang: Language) {
      state.currentLang = currentLang
    },
    [TOGGLE_AUTO_CHECK](state: App, autoCheck: boolean) {
      state.autoCheck = autoCheck
    },
    [SET_MAX_RECONNECT_TIMES](state: App, maxReconnectTimes: number) {
      state.maxReconnectTimes = maxReconnectTimes
    },
    [CHANGE_ACTIVE_CONNECTION](state: App, payload: Client) {
      const { id, client, messages } = payload
      if (state.activeConnection[id]) {
        Vue.set(state.activeConnection[id], 'client', client)
        Vue.set(state.activeConnection[id], 'messages', messages)
      } else {
        Vue.set(state.activeConnection, id, {
          client,
          messages,
        })
      }
    },
    [REMOVE_ACTIVE_CONNECTION](state: App, id: string) {
      delete state.activeConnection[id]
      delete state.unreadMessageCount[id]
      delete state.showClientInfo[id]
    },
    [CHANGE_SUBSCRIPTIONS](state: App, payload: Subscriptions) {
      state.activeConnection[payload.id].subscriptions = payload.subscriptions
    },
    [SHOW_CLIENT_INFO](state: App, payload: ClientInfo) {
      state.showClientInfo[payload.id] = payload.showClientInfo
    },
    [SHOW_SUBSCRIPTIONS](state: App, payload: SubscriptionsVisible) {
      state.showSubscriptions = payload.showSubscriptions
      localStorage.setItem('showSubscriptions', JSON.stringify(state.showSubscriptions))
    },
    [SET_CONNECTIONS_TREE](state: App, payload: ConnectionTreeState) {
      const { id } = payload
      state.connectionTreeState[id] = { expanded: payload.expanded }
    },
    [UNREAD_MESSAGE_COUNT_INCREMENT](state: App, payload: UnreadMessage) {
      if (payload.unreadMessageCount !== undefined) {
        Vue.set(state.unreadMessageCount, payload.id, payload.unreadMessageCount)
      } else {
        const currentCount: number | undefined = state.unreadMessageCount[payload.id]
        let count = 0
        if (currentCount !== undefined) {
          count = currentCount + 1
        } else {
          count += 1
        }
        Vue.set(state.unreadMessageCount, payload.id, count)
      }
    },
    [TOGGLE_ADVANCED_VISIBLE](state: App, advancedVisible: boolean) {
      state.advancedVisible = advancedVisible
    },
    [TOGGLE_WILL_MESSAGE_VISIBLE](state: App, willMessageVisible: boolean) {
      state.willMessageVisible = willMessageVisible
    },
    [CHANGE_ALL_CONNECTIONS](state: App, allConnections: ConnectionModel[] | []) {
      state.allConnections = allConnections
    },
    [SET_SCRIPT](state: App, currentScript: ScriptState) {
      state.currentScript = currentScript
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
    SET_MAX_RECONNECT_TIMES({ commit }: any, payload: App) {
      setSettings('settings.maxReconnectTimes', payload.maxReconnectTimes)
      commit(SET_MAX_RECONNECT_TIMES, payload.maxReconnectTimes)
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
    SET_CONNECTIONS_TREE({ commit }: any, payload: App) {
      commit(SET_CONNECTIONS_TREE, payload)
    },
    SHOW_SUBSCRIPTIONS({ commit }: any, payload: App) {
      commit(SHOW_SUBSCRIPTIONS, payload)
    },
    UNREAD_MESSAGE_COUNT_INCREMENT({ commit }: any, payload: App) {
      commit(UNREAD_MESSAGE_COUNT_INCREMENT, payload)
    },
    TOGGLE_ADVANCED_VISIBLE({ commit }: any, payload: App) {
      commit(TOGGLE_ADVANCED_VISIBLE, payload.advancedVisible)
    },
    TOGGLE_WILL_MESSAGE_VISIBLE({ commit }: any, payload: App) {
      commit(TOGGLE_WILL_MESSAGE_VISIBLE, payload.willMessageVisible)
    },
    CHANGE_ALL_CONNECTIONS({ commit }: any, payload: App) {
      commit(CHANGE_ALL_CONNECTIONS, payload.allConnections)
    },
    SET_SCRIPT({ commit }: any, payload: App) {
      commit(SET_SCRIPT, payload.currentScript)
    },
  },
}

export default app
