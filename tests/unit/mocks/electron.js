// Simple Electron mock for testing environment
module.exports = {
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
