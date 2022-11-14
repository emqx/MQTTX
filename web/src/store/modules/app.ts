import Vue from 'vue'
import { loadSettings, setSettings } from '@/utils/api/setting'

const TOGGLE_THEME = 'TOGGLE_THEME'
const TOGGLE_LANG = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK = 'TOGGLE_AUTO_CHECK'
const TOGGLE_AUTO_RESUB = 'TOGGLE_AUTO_RESUB'
const TOGGLE_AUTO_SCROLL = 'TOGGLE_AUTO_SCROLL'
const SET_AUTO_SCROLL_INTERVAL = 'SET_AUTO_SCROLL_INTERVAL'
const SET_MAX_RECONNECT_TIMES = 'SET_MAX_RECONNECT_TIMES'
const CHANGE_ACTIVE_CONNECTION = 'CHANGE_ACTIVE_CONNECTION'
const REMOVE_ACTIVE_CONNECTION = 'REMOVE_ACTIVE_CONNECTION'
const CHANGE_SUBSCRIPTIONS = 'CHANGE_SUBSCRIPTIONS'
const SHOW_CLIENT_INFO = 'SHOW_CLIENT_INFO'
const SHOW_SUBSCRIPTIONS = 'SHOW_SUBSCRIPTIONS'
const UNREAD_MESSAGE_COUNT_INCREMENT = 'UNREAD_MESSAGE_COUNT_INCREMENT'
const TOGGLE_WILL_MESSAGE_VISIBLE = 'TOGGLE_WILL_MESSAGE_VISIBLE'
const TOGGLE_ADVANCED_VISIBLE = 'TOGGLE_ADVANCED_VISIBLE'
const CHANGE_ALL_CONNECTIONS = 'CHANGE_ALL_CONNECTIONS'
const TOGGLE_MULTI_TOPICS = 'TOGGLE_MULTI_TOPICS'

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
    autoResub: stateRecord.autoResub,
    autoScroll: stateRecord.autoScroll,
    autoScrollInterval: stateRecord.autoScrollInterval,
    multiTopics: stateRecord.multiTopics,
    maxReconnectTimes: stateRecord.maxReconnectTimes || 10,
    showSubscriptions: getShowSubscriptions(),
    showClientInfo: {},
    unreadMessageCount: {},
    activeConnection: {},
    advancedVisible: true,
    willMessageVisible: true,
    allConnections: [],
  },
  mutations: {
    [TOGGLE_THEME](state: App, currentTheme: Theme) {
      state.currentTheme = currentTheme
    },
    [TOGGLE_LANG](state: App, currentLang: Language) {
      state.currentLang = currentLang
    },
    [TOGGLE_AUTO_CHECK](state: App, autoCheck: boolean) {
      state.autoCheck = autoCheck
    },
    [TOGGLE_AUTO_RESUB](state: App, autoResub: boolean) {
      state.autoResub = autoResub
    },
    [TOGGLE_AUTO_SCROLL](state: App, autoScroll: boolean) {
      state.autoScroll = autoScroll
    },
    [SET_AUTO_SCROLL_INTERVAL](state: App, autoScrollInterval: number) {
      state.autoScrollInterval = autoScrollInterval
    },
    [TOGGLE_MULTI_TOPICS](state: App, multiTopics: boolean) {
      state.multiTopics = multiTopics
    },
    [SET_MAX_RECONNECT_TIMES](state: App, maxReconnectTimes: number) {
      state.maxReconnectTimes = maxReconnectTimes
    },
    [CHANGE_ACTIVE_CONNECTION](state: App, payload: Client) {
      const { id, client, messages } = payload
      if (state.activeConnection[id]) {
        // already exists activeConnection
        Vue.set(state.activeConnection[id], 'client', client)
        Vue.set(state.activeConnection[id], 'messages', messages)
      } else {
        // new activeConnection
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
    [UNREAD_MESSAGE_COUNT_INCREMENT](state: App, payload: UnreadMessage) {
      if (payload.unreadMessageCount !== undefined) {
        Vue.set(state.unreadMessageCount, payload.id, payload.unreadMessageCount)
      } else {
        const currentCount = state.unreadMessageCount[payload.id]
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
    TOGGLE_AUTO_RESUB({ commit }: any, payload: App) {
      setSettings('settings.autoResub', payload.autoResub)
      commit(TOGGLE_AUTO_RESUB, payload.autoResub)
    },
    TOGGLE_AUTO_SCROLL({ commit }: any, payload: App) {
      setSettings('settings.autoScroll', payload.autoScroll)
      commit(TOGGLE_AUTO_SCROLL, payload.autoScroll)
    },
    SET_AUTO_SCROLL_INTERVAL({ commit }: any, payload: App) {
      setSettings('settings.autoScrollInterval', payload.autoScrollInterval)
      commit(SET_AUTO_SCROLL_INTERVAL, payload.autoScrollInterval)
    },
    TOGGLE_MULTI_TOPICS({ commit }: any, payload: App) {
      setSettings('settings.multiTopics', payload.multiTopics)
      commit(TOGGLE_MULTI_TOPICS, payload.multiTopics)
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
  },
}

export default app
