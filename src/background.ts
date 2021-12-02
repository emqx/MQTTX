import 'reflect-metadata' // Required by TypoORM.
;('use strict')
import { app, protocol, BrowserWindow, ipcMain, shell, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { quitAndRenameLogger } from './utils/logger'
import updateChecker from './main/updateChecker'
import getMenuTemplate from './main/getMenuTemplate'
import saveFile from './main/saveFile'
import saveExcel from './main/saveExcel'
import newWindow from './main/newWindow'
import { onSystemThemeChanged } from './main/systemTheme'
import useConnection, { initOptionModel } from '@/database/useConnection'
import useServices from '@/database/useServices'

declare const __static: string

let theme: Theme = 'light'
let autoCheckUpdate: boolean = true
const windowSize = {
  width: 1025,
  height: 749,
}
const isDevelopment: boolean = process.env.NODE_ENV !== 'production'
const isMac: boolean = process.platform === 'darwin'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null

let menu: Menu | null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

app.allowRendererProcessReuse = false

const { ConnectionInit, ConnectionDestory } = useConnection()

function handleIpcMessages() {
  ipcMain.on('setting', (event: Electron.IpcMainEvent, ...args: any[]) => {
    event.sender.send('setting', ...args)
  })
  ipcMain.on('checkUpdate', () => {
    updateChecker(false)
  })
  ipcMain.on('exportData', (event: Electron.IpcMainEvent, ...args: any[]) => {
    const [filename, content, type] = args
    if (win) {
      if (typeof content === 'string') {
        saveFile(win, filename, content, type)
      } else {
        saveExcel(win, filename, content)
      }
    }
  })
  ipcMain.on('newWindow', (event: Electron.IpcMainEvent, ...args: any[]) => {
    if (win) {
      const id = args[0]
      newWindow(id, { isMac, theme, static: __static, path: '/new_window' })
    }
  })
  ipcMain.on('getWindowSize', (event: Electron.IpcMainEvent, ...args: any[]) => {
    if (win) {
      event.sender.send('getWindowSize', win.getBounds())
    }
  })
}

// handle event when APP quit
function beforeAppQuit() {
  // close all log appender and rename log file with date
  quitAndRenameLogger()
  // close all SQLite connection
  ConnectionDestory()
  // quit APP
  app.quit()
}

async function createWindow() {
  // Init tables and connect to local database.
  await ConnectionInit({ doMigrations: true } as initOptionModel)
  const { settingService } = useServices()
  await settingService.set()
  const setting = await settingService.get()
  if (setting) {
    theme = setting.currentTheme
    autoCheckUpdate = setting.autoCheck
    windowSize.height = setting.height
    windowSize.width = setting.width
    //@ts-ignore
    global.sharedData = {
      currentTheme: setting.currentTheme,
      currentLang: setting.currentLang,
      autoCheck: setting.autoCheck,
      autoResub: setting.autoResub,
      autoScroll: setting.autoScroll,
      maxReconnectTimes: setting.maxReconnectTimes,
    }
  }
  // Create the browser window.
  win = new BrowserWindow({
    ...windowSize,
    minHeight: 650,
    minWidth: 997,
    webPreferences: {
      devTools: isDevelopment,
      webSecurity: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: isMac ? 'hidden' : 'default',
    backgroundColor: theme === 'dark' ? '#232323' : theme === 'night' ? '#212328' : '#ffffff',
    icon: `${__static}/app.ico`,
  })
  // Theme change
  if (isMac) {
    onSystemThemeChanged(async (theme) => {
      win?.webContents.send('setting', 'theme', theme)
    })
  }
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
    beforeAppQuit()
  })
  handleIpcMessages()
  if (autoCheckUpdate) {
    updateChecker()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e)
    }
  }
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMac) {
    beforeAppQuit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
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
        beforeAppQuit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      beforeAppQuit()
    })
  }
}
