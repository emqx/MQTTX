import { BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { enable } from '@electron/remote/main'

interface WindowOptions {
  theme: Theme
  isMac: boolean
  static: string
  path: string
}

const newWindow = (id: string, options: WindowOptions) => {
  let winPos = BrowserWindow.getFocusedWindow()
  let [x, y] = [0, 0]
  if (winPos) {
    const [currentWindowX, currentWindowY] = winPos.getPosition()
    x = currentWindowX + 30
    y = currentWindowY + 30
  }
  // Create window
  let createWindow: BrowserWindow | null = new BrowserWindow({
    width: 1025,
    height: 749,
    x,
    y,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: options.isMac ? 'hidden' : 'default',
    backgroundColor: options.theme === 'dark' ? '#232323' : '#ffffff',
    icon: `${options.static}/app.ico`,
  })
  // Load page
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    createWindow.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}#${options.path}/${id}`)
    if (!process.env.IS_TEST) {
      createWindow.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    createWindow.loadURL(`app://./index.html/#${options.path}/${id}`)
  }
  // 添加 @electron/remote 初始化
  enable(createWindow.webContents)
  createWindow.on('closed', () => {
    createWindow = null
  })
}

export default newWindow
