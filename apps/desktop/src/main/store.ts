import { ipcMain } from 'electron'
import Store from 'electron-store'
import { setMenu } from './config/menu'

// FIXME: https://github.com/sindresorhus/electron-store/issues/276
const store = new Store() as any

function useStore() {
  ipcMain.handle('store-send', (_event, params) => {
    const { action, key, value } = params

    switch (action) {
      case 'get':
        return store.get(key)

      case 'set': {
        const result = store.set(key, value)
        if (key === 'currentLang') {
          setMenu()
        }
        return result
      }
    }
  })
}

export { useStore }
