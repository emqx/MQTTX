const getters = {
  currentTheme: (state: State) => state.app.currentTheme,
  currentLang: (state: State) => state.app.currentLang,
  autoCheck: (state: State) => state.app.autoCheck,
  showSubscriptions: (state: State) => state.app.showSubscriptions,
  activeConnection: (state: State) => state.app.activeConnection,
  showClientInfo: (state: State) => state.app.showClientInfo,
  unreadMessageCount: (state: State) => state.app.unreadMessageCount,
  MacOSTop: (state: State) => state.app.MacOSTop,
}

export default getters
