const getters = {
  currentTheme: (state: State) => state.app.currentTheme,
  currentLang: (state: State) => state.app.currentLang,
  autoCheck: (state: State) => state.app.autoCheck,
  maxReconnectTimes: (state: State) => state.app.maxReconnectTimes,
  showSubscriptions: (state: State) => state.app.showSubscriptions,
  activeConnection: (state: State) => state.app.activeConnection,
  showClientInfo: (state: State) => state.app.showClientInfo,
  unreadMessageCount: (state: State) => state.app.unreadMessageCount,
  willMessageVisible: (state: State) => state.app.willMessageVisible,
  connectionCollection: (state: State) => state.app.connectionCollection,
  advancedVisible: (state: State) => state.app.advancedVisible,
  allConnections: (state: State) => state.app.allConnections,
  currentScript: (state: State) => state.app.currentScript,
}

export default getters
