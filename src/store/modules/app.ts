import Vue from 'vue'
import useServices from '@/database/useServices'
import { remote } from 'electron'

const TOGGLE_THEME = 'TOGGLE_THEME'
const TOGGLE_LANG = 'TOGGLE_LANG'
const TOGGLE_AUTO_CHECK = 'TOGGLE_AUTO_CHECK'
const TOGGLE_AUTO_RESUB = 'TOGGLE_AUTO_RESUB'
const SET_MAX_RECONNECT_TIMES = 'SET_MAX_RECONNECT_TIMES'
const CHANGE_ACTIVE_CONNECTION = 'CHANGE_ACTIVE_CONNECTION'
const REMOVE_ACTIVE_CONNECTION = 'REMOVE_ACTIVE_CONNECTION'
const CHANGE_SUBSCRIPTIONS = 'CHANGE_SUBSCRIPTIONS'
const SHOW_CLIENT_INFO = 'SHOW_CLIENT_INFO'
const UNREAD_MESSAGE_COUNT_INCREMENT = 'UNREAD_MESSAGE_COUNT_INCREMENT'
const SET_CONNECTIONS_TREE = 'SET_CONNECTIONS_TREE'
const TOGGLE_WILL_MESSAGE_VISIBLE = 'TOGGLE_WILL_MESSAGE_VISIBLE'
const TOGGLE_ADVANCED_VISIBLE = 'TOGGLE_ADVANCED_VISIBLE'
const SET_SCRIPT = 'SET_SCRIPT'
const SET_CURRENT_CONNECTION_ID = 'SET_CURRENT_CONNECTION_ID'
const TOGGLE_SYNC_OS_THEME = 'TOGGLE_SYNC_OS_THEME'
const TOGGLE_MULTI_TOPICS = 'TOGGLE_MULTI_TOPICS'
const TOGGLE_JSON_HIGHLIGHT = 'TOGGLE_JSON_HIGHLIGHT'
const SET_OPEN_AI_HOST = 'SET_OPEN_AI_HOST'
const SET_OPEN_AI_API_KEY = 'SET_OPEN_AI_API_KEY'
const SET_MODEL = 'SET_MODEL'
const SET_INSERT_BUTTON_ADDED = 'SET_INSERT_BUTTON_ADDED'
const TOGGLE_ENABLE_COPILOT = 'TOGGLE_ENABLE_COPILOT'
const SET_LOG_LEVEL = 'SET_LOG_LEVEL'
const TOGGLE_SHOW_CONNECTION_LIST = 'TOGGLE_SHOW_CONNECTION_LIST'
const SET_DATABASE_FAIL_MESSAGE = 'SET_DATABASE_FAIL_MESSAGE'
const TOGGLE_IGNORE_QOS0_MESSAGE = 'TOGGLE_IGNORE_QOS0_MESSAGE'

const getShowConnectionList = (): boolean => {
  const _showConnectionList: string | null = localStorage.getItem('showConnectionList')
  if (!_showConnectionList) {
    return true
  }
  return JSON.parse(_showConnectionList)
}

const settingData = remote.getGlobal('sharedData')

const app = {
  state: {
    currentTheme: settingData.currentTheme || 'light',
    currentLang: settingData.currentLang || 'en',
    autoCheck: settingData.autoCheck,
    autoResub: settingData.autoResub,
    syncOsTheme: settingData.syncOsTheme,
    multiTopics: settingData.multiTopics,
    jsonHighlight: settingData.jsonHighlight,
    maxReconnectTimes: settingData.maxReconnectTimes || 10,
    showClientInfo: {},
    unreadMessageCount: {},
    connectionTreeState: {},
    activeConnection: {},
    advancedVisible: true,
    willMessageVisible: true,
    currentScript: null,
    currentConnectionId: null,
    enableCopilot: settingData.enableCopilot,
    openAIAPIHost: settingData.openAIAPIHost || 'https://api.openai.com/v1',
    openAIAPIKey: settingData.openAIAPIKey || '',
    model: settingData.model || 'gpt-3.5-turbo',
    isPrismButtonAdded: false,
    logLevel: settingData.logLevel || 'info',
    showConnectionList: getShowConnectionList(),
    connectDatabaseFailMessage: settingData.connectDatabaseFailMessage || '',
    ignoreQoS0Message: settingData.ignoreQoS0Message || false,
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
    [TOGGLE_SYNC_OS_THEME](state: App, syncOsTheme: boolean) {
      state.syncOsTheme = syncOsTheme
    },
    [TOGGLE_MULTI_TOPICS](state: App, multiTopics: boolean) {
      state.multiTopics = multiTopics
    },
    [SET_MAX_RECONNECT_TIMES](state: App, maxReconnectTimes: number) {
      state.maxReconnectTimes = maxReconnectTimes
    },
    [TOGGLE_JSON_HIGHLIGHT](state: App, jsonHighlight: boolean) {
      state.jsonHighlight = jsonHighlight
    },
    [CHANGE_ACTIVE_CONNECTION](state: App, payload: Client) {
      const { id, client } = payload
      if (state.activeConnection[id]) {
        // already exists activeConnection
        Vue.set(state.activeConnection[id], 'client', client)
      } else {
        // new activeConnection
        Vue.set(state.activeConnection, id, {
          client,
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
          count = currentCount + (payload.increasedCount ?? 1)
        } else {
          count += payload.increasedCount ?? 1
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
    [SET_SCRIPT](state: App, currentScript: ScriptState) {
      state.currentScript = currentScript
    },
    [SET_CURRENT_CONNECTION_ID](state: App, currentConnectionId: string) {
      state.currentConnectionId = currentConnectionId
    },
    [SET_OPEN_AI_HOST](state: App, openAIHost: string) {
      state.openAIAPIHost = openAIHost
    },
    [SET_OPEN_AI_API_KEY](state: App, openAIAPIKey: string) {
      state.openAIAPIKey = openAIAPIKey
    },
    [SET_MODEL](state: App, model: AIModel) {
      state.model = model
    },
    [SET_INSERT_BUTTON_ADDED](state: App, isPrismButtonAdded: boolean) {
      state.isPrismButtonAdded = isPrismButtonAdded
    },
    [TOGGLE_ENABLE_COPILOT](state: App, enableCopilot: boolean) {
      state.enableCopilot = enableCopilot
    },
    [SET_LOG_LEVEL](state: App, logLevel: LogLevel) {
      state.logLevel = logLevel
    },
    [TOGGLE_SHOW_CONNECTION_LIST](state: App, showConnectionList: boolean) {
      state.showConnectionList = showConnectionList
      localStorage.setItem('showConnectionList', JSON.stringify(state.showConnectionList))
    },
    [SET_DATABASE_FAIL_MESSAGE](state: App, connectDatabaseFailMessage: string) {
      state.connectDatabaseFailMessage = connectDatabaseFailMessage
    },
    [TOGGLE_IGNORE_QOS0_MESSAGE](state: App, ignoreQoS0Message: boolean) {
      state.ignoreQoS0Message = ignoreQoS0Message
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
    async TOGGLE_SYNC_OS_THEME({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_SYNC_OS_THEME, payload.syncOsTheme)
      settingData.syncOsTheme = payload.syncOsTheme
      await settingService.update(payload)
    },
    async TOGGLE_MULTI_TOPICS({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_MULTI_TOPICS, payload.multiTopics)
      settingData.multiTopics = payload.multiTopics
      await settingService.update(payload)
    },
    async TOGGLE_JSON_HIGHLIGHT({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_JSON_HIGHLIGHT, payload.jsonHighlight)
      settingData.jsonHighlight = payload.jsonHighlight
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
    async UNREAD_MESSAGE_COUNT_INCREMENT({ commit }: any, payload: App) {
      commit(UNREAD_MESSAGE_COUNT_INCREMENT, payload)
    },
    async TOGGLE_ADVANCED_VISIBLE({ commit }: any, payload: App) {
      commit(TOGGLE_ADVANCED_VISIBLE, payload.advancedVisible)
    },
    async TOGGLE_WILL_MESSAGE_VISIBLE({ commit }: any, payload: App) {
      commit(TOGGLE_WILL_MESSAGE_VISIBLE, payload.willMessageVisible)
    },
    async SET_SCRIPT({ commit }: any, payload: App) {
      commit(SET_SCRIPT, payload.currentScript)
    },
    async SET_CURRENT_CONNECTION_ID({ commit }: any, currentConnectionId: string) {
      commit(SET_CURRENT_CONNECTION_ID, currentConnectionId)
    },
    async TOGGLE_ENABLE_COPILOT({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_ENABLE_COPILOT, payload.enableCopilot)
      settingData.enableCopilot = payload.enableCopilot
      await settingService.update(payload)
    },
    async SET_OPEN_AI_HOST({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(SET_OPEN_AI_HOST, payload.openAIAPIHost)
      settingData.openAIAPIHost = payload.openAIAPIHost
      await settingService.update(payload)
    },
    async SET_OPEN_AI_API_KEY({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(SET_OPEN_AI_API_KEY, payload.openAIAPIKey)
      settingData.openAIAPIKey = payload.openAIAPIKey
      await settingService.update(payload)
    },
    async SET_MODEL({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(SET_MODEL, payload.model)
      settingData.model = payload.model
      await settingService.update(payload)
    },
    SET_INSERT_BUTTON_ADDED({ commit }: any, payload: App) {
      commit(SET_INSERT_BUTTON_ADDED, payload.isPrismButtonAdded)
    },
    async SET_LOG_LEVEL({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(SET_LOG_LEVEL, payload.logLevel)
      settingData.logLevel = payload.logLevel
      await settingService.update(payload)
    },
    TOGGLE_SHOW_CONNECTION_LIST({ commit }: any, payload: App) {
      commit(TOGGLE_SHOW_CONNECTION_LIST, payload.showConnectionList)
    },
    SET_DATABASE_FAIL_MESSAGE({ commit }: any, payload: App) {
      commit(SET_DATABASE_FAIL_MESSAGE, payload.connectDatabaseFailMessage)
    },
    async TOGGLE_IGNORE_QOS0_MESSAGE({ commit }: any, payload: App) {
      const { settingService } = useServices()
      commit(TOGGLE_IGNORE_QOS0_MESSAGE, payload.ignoreQoS0Message)
      settingData.ignoreQoS0Message = payload.ignoreQoS0Message
      await settingService.update(payload)
    },
  },
}

export default app
