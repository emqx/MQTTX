const getters = {
  currentTheme: (state: State) => state.app.currentTheme,
  currentLang: (state: State) => state.app.currentLang,
  autoCheck: (state: State) => state.app.autoCheck,
  autoResub: (state: State) => state.app.autoResub,
  syncOsTheme: (state: State) => state.app.syncOsTheme,
  maxReconnectTimes: (state: State) => state.app.maxReconnectTimes,
  showSubscriptions: (state: State) => state.app.showSubscriptions,
  connectionTreeState: (state: State) => state.app.connectionTreeState,
  activeConnection: (state: State) => state.app.activeConnection,
  showClientInfo: (state: State) => state.app.showClientInfo,
  unreadMessageCount: (state: State) => state.app.unreadMessageCount,
  willMessageVisible: (state: State) => state.app.willMessageVisible,
  advancedVisible: (state: State) => state.app.advancedVisible,
  allConnections: (state: State) => state.app.allConnections,
  currentScript: (state: State) => state.app.currentScript,
  multiTopics: (state: State) => state.app.multiTopics,
  jsonHighlight: (state: State) => state.app.jsonHighlight,
  openAIAPIKey: (state: State) => state.app.openAIAPIKey,
  model: (state: State) => state.app.model,
  isPrismButtonAdded: (state: State) => state.app.isPrismButtonAdded,
}

export default getters
