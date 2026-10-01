// Simple Electron mock for testing environment
const path = require('path')
const os = require('os')
const userData = path.join(os.tmpdir(), `mqttx-unit-tests-${process.pid}`)

module.exports = {
  ipcRenderer: {
    on: () => {},
    once: () => {},
    invoke: () => Promise.resolve({}),
    send: () => {},
    sendSync: () => ({ defaultCwd: userData, appVersion: '1.0.0' }),
    removeListener: () => {},
    removeAllListeners: () => {},
  },
  remote: {
    dialog: {
      showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: ['/mock/path'] }),
      showSaveDialog: () => Promise.resolve({ canceled: false, filePath: '/mock/path' }),
    },
    app: {
      getPath: () => userData,
    },
  },
  dialog: {
    showOpenDialog: () => Promise.resolve({ canceled: false, filePaths: ['/mock/path'] }),
    showSaveDialog: () => Promise.resolve({ canceled: false, filePath: '/mock/path' }),
  },
  app: {
    getPath: () => userData,
  },
}
