'use strict'

import { app, protocol, BrowserWindow, ipcMain, shell, Menu } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
import db from './database/index'
import updateChecker from './main/updateChecker'
import getMenuTemplate from './main/getMenuTemplate'
import saveFile from './main/saveFile'
import saveExcel from './main/saveExcel'

interface WindowSizeModel {
  width: number
  height: number
}

declare const __static: string

const isDevelopment: boolean = process.env.NODE_ENV !== 'production'
const isMac: boolean = process.platform === 'darwin'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null

let menu: Menu | null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

function handleIpcMessages() {
  ipcMain.on('setting', (event: any, ...args: any[]) => {
    event.sender.send('setting', ...args)
  })
  ipcMain.on('checkUpdate', () => {
    updateChecker(false)
  })
  ipcMain.on('exportData', (event: any, ...args: any[]) => {
    const [filename, content, type] = args
    if (win) {
      if (typeof content === 'string') {
        saveFile(win, filename, content, type)
      } else {
        saveExcel(win, filename, content)
      }
    }
  })
}

function createWindow() {
  const windowSize = db.get<WindowSizeModel>('windowSize')
  const theme = db.get<Theme>('settings.currentTheme')
  // Create the browser window.
  win = new BrowserWindow({
    ...windowSize,
    webPreferences: {
      devTools: isDevelopment,
      webSecurity: false,
      nodeIntegration: true,
    },
    titleBarStyle: isMac ? 'hidden' : 'default',
    backgroundColor: theme === 'dark' ? '#232323' : '#ffffff',
    icon: `${__static}/app.ico`,
  })

  // Menu Manger
  const templateMenu = getMenuTemplate(win)
  menu = Menu.buildFromTemplate(templateMenu)
  Menu.setApplicationMenu(menu)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
    app.quit()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  const autoCheckUpdate = db.get<boolean>('settings.autoCheck')
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  handleIpcMessages()
  if (autoCheckUpdate) {
    updateChecker()
  }
})

// Disabled create new window
app.on('web-contents-created', (event, contents) => {
  // tslint:disable-next-line:no-shadowed-variable
  contents.on('new-window', async (event, navigationUrl) => {
    // In this example, we'll ask the operating system
    // to open this event's url in the default browser.
    event.preventDefault()
    await shell.openExternal(navigationUrl)
  })
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
