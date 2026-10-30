// Simple Electron mock for testing environment
module.exports = {
  getGlobal: () => ({}),
  nativeTheme: {
    shouldUseDarkColors: false,
    on: () => {},
    removeListener: () => {},
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
  // Reversible stand-in so renderer code that encrypts through safeStorage works in tests
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (plain) => Buffer.from(plain, 'utf8'),
    decryptString: (encrypted) => encrypted.toString('utf8'),
  },
}
