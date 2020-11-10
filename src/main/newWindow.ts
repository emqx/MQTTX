import { BrowserWindow, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import getMenuTemplate from './getMenuTemplate'

interface WindowOptions {
  theme: Theme
  isMac: boolean
  static: string
}

const newWindow = (id: string, options: WindowOptions) => {
  // Create window
  let createWindow: BrowserWindow | null = new BrowserWindow({
    width: 1025,
    height: 749,
    x: 600,
    y: 600,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
    },
    titleBarStyle: options.isMac ? 'hidden' : 'default',
    backgroundColor: options.theme === 'dark' ? '#232323' : '#ffffff',
    icon: `${options.static}/app.ico`,
  })
  // Load page
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    createWindow.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL as string}#/new_window/${id}`)
    if (!process.env.IS_TEST) {
      createWindow.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    createWindow.loadURL(`app://./index.html/#/new_window/${id}`)
  }
  createWindow.on('closed', () => {
    createWindow = null
  })
}

export default newWindow
