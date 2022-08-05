import Vue from 'vue'
import useServices from '@/database/useServices'
import { remote } from 'electron'

const TOGGLE_THEME = 'TOGGLE_THEME'
const TOGGLE_LANG = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK = 'TOGGLE_AUTO_CHECK'
const TOGGLE_AUTO_RESUB = 'TOGGLE_AUTO_RESUB'
const TOGGLE_AUTO_SCROLL = 'TOGGLE_AUTO_SCROLL'
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
const TOGGLE_SYNC_OS_THEME = 'TOGGLE_SYNC_OS_THEME'
const TOGGLE_MULTI_TOPICS = 'TOGGLE_MULTI_TOPICS'

const getShowSubscriptions = (): boolean => {
  const $showSubscriptions: string | null = localStorage.getItem('showSubscriptions')
  if (!$showSubscriptions) {
    return true
  }
  return JSON.parse($showSubscriptions)
}

const settingData = remote.getGlobal('sharedData')

const app = {
  state: {
    currentTheme: settingData.currentTheme || 'light',
    currentLang: settingData.currentLang || 'en',
    autoCheck: settingData.autoCheck,
    autoResub: settingData.autoResub,
    autoScroll: settingData.autoScroll,
    syncOsTheme: settingData.syncOsTheme,
    maxReconnectTimes: settingData.maxReconnectTimes || 10,
    showSubscriptions: getShowSubscriptions(),
    showClientInfo: {},
    unreadMessageCount: {},
    connectionTreeState: {},
    activeConnection: {},
    advancedVisible: true,
    willMessageVisible: true,
    allConnections: [],
    currentScript: null,
    multiTopics: true,
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
    [TOGGLE_SYNC_OS_THEME](state: App, syncOsTheme: boolean) {
      state.syncOsTheme = syncOsTheme
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
    async TOGGLE_THEME({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_THEME, payload.currentTheme)
      settingData.currentTheme = payload.currentTheme
      await settingService.update(payload)
    },
    async TOGGLE_LANG({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_LANG, payload.currentLang)
      settingData.currentLang = payload.currentLang
      await settingService.update(payload)
    },
    async TOGGLE_AUTO_CHECK({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_AUTO_CHECK, payload.autoCheck)
      settingData.autoCheck = payload.autoCheck
      await settingService.update(payload)
    },
    async TOGGLE_AUTO_RESUB({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_AUTO_RESUB, payload.autoResub)
      settingData.autoResub = payload.autoResub
      await settingService.update(payload)
    },
    async TOGGLE_AUTO_SCROLL({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_AUTO_SCROLL, payload.autoScroll)
      settingData.autoScroll = payload.autoScroll
      await settingService.update(payload)
    },
    async TOGGLE_SYNC_OS_THEME({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_SYNC_OS_THEME, payload.syncOsTheme)
      settingData.syncOsTheme = payload.syncOsTheme
      await settingService.update(payload)
    },
    async SET_MAX_RECONNECT_TIMES({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(SET_MAX_RECONNECT_TIMES, payload.maxReconnectTimes)
      settingData.maxReconnectTimes = payload.maxReconnectTimes
      await settingService.update(payload)
    },
    async CHANGE_ACTIVE_CONNECTION({ commit }: any, payload: App) {
      commit(CHANGE_ACTIVE_CONNECTION, payload)
    },
    async REMOVE_ACTIVE_CONNECTION({ commit }: any, { id }: { id: string }) {
      commit(REMOVE_ACTIVE_CONNECTION, id)
    },
    async CHANGE_SUBSCRIPTIONS({ commit }: any, payload: App) {
      commit(CHANGE_SUBSCRIPTIONS, payload)
    },
    async SHOW_CLIENT_INFO({ commit }: any, payload: App) {
      commit(SHOW_CLIENT_INFO, payload)
    },
    async SET_CONNECTIONS_TREE({ commit }: any, payload: App) {
      commit(SET_CONNECTIONS_TREE, payload)
    },
    async SHOW_SUBSCRIPTIONS({ commit }: any, payload: App) {
      commit(SHOW_SUBSCRIPTIONS, payload)
    },
    async UNREAD_MESSAGE_COUNT_INCREMENT({ commit }: any, payload: App) {
      commit(UNREAD_MESSAGE_COUNT_INCREMENT, payload)
    },
    async TOGGLE_ADVANCED_VISIBLE({ commit }: any, payload: App) {
      commit(TOGGLE_ADVANCED_VISIBLE, payload.advancedVisible)
    },
    async TOGGLE_WILL_MESSAGE_VISIBLE({ commit }: any, payload: App) {
      commit(TOGGLE_WILL_MESSAGE_VISIBLE, payload.willMessageVisible)
    },
    async CHANGE_ALL_CONNECTIONS({ commit }: any, payload: App) {
      commit(CHANGE_ALL_CONNECTIONS, payload.allConnections)
    },
    async SET_SCRIPT({ commit }: any, payload: App) {
      commit(SET_SCRIPT, payload.currentScript)
    },
    async TOGGLE_MULTI_TOPICS({ commit }: any, payload: App) {
      commit(TOGGLE_MULTI_TOPICS, payload.multiTopics)
    },
  },
}

export default app
