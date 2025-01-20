import { ipcMain } from 'electron'
import Store from 'electron-store'

// FIXME: https://github.com/sindresorhus/electron-store/issues/276
const store = new Store() as any

function useStore() {
  ipcMain.handle('store-send', (_event, params) => {
    const { action, key, value } = params

    switch (action) {
      case 'get':
        return store.get(key)

      case 'set':
        return store.set(key, value)
    }
  })
}

export { useStore }
