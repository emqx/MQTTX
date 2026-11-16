// Simple Electron mock for testing environment
module.exports = {
  BrowserWindow: {
    fromWebContents: () => null,
  },
  getGlobal: () => ({}),
  nativeTheme: {
    shouldUseDarkColors: false,
    on: () => {},
    removeListener: () => {},
  },
  ipcMain: {
    handle: () => {},
  },
  ipcRenderer: {
    on: () => {},
    once: () => {},
    invoke: () => Promise.resolve({}),
    send: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
  },
  remote: {
    dialog: {
      showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: ['/mock/path'] }),
      showSaveDialog: () => Promise.resolve({ canceled: false, filePath: '/mock/path' }),
    },
    app: {
      getPath: () => '/mock/path',
    },
  },
  dialog: {
    showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: ['/mock/path'] }),
    showSaveDialog: () => Promise.resolve({ canceled: false, filePath: '/mock/path' }),
  },
  app: {
    getPath: () => '/mock/path',
  },
}
