import 'reflect-metadata' // Required by TypoORM.
;('use strict')
import { app, protocol, BrowserWindow, ipcMain, shell, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { quitAndRenameLogger } from './utils/logger'
import { defaultWindowSize, restoreWindowState, saveWindowState } from './utils/windowStateManager'
import rebuildDatabase from './database/rebuildDatabase'
import { createUpdateWindow, autoDownload } from './main/updateDownloader'
import { getCurrentLang } from './main/updateChecker'
import getMenuTemplate from './main/getMenuTemplate'
import saveFile from './main/saveFile'
import saveExcel from './main/saveExcel'
import newWindow from './main/newWindow'
import installCLI from './main/installCLI'
import { onSystemThemeChanged } from './main/systemTheme'
import useConnection, { initOptionModel } from '@/database/useConnection'
import useServices from '@/database/useServices'
import { dialog } from 'electron'
import ORMConfig from './database/database.config'
import version from '@/version'
import { initialize } from '@electron/remote/main'
import { initMCPHandlers, cleanupMCPConnections } from './main/ai/mpc/MPCManager'

declare const __static: string

const Store = require('electron-store')
const electronStore = new Store()
let theme: Theme = 'light'
let syncOsTheme = false
let autoCheckUpdate: boolean = true
const isDevelopment: boolean = process.env.NODE_ENV !== 'production'
const isMac: boolean = process.platform === 'darwin'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null

let menu: Menu | null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

const { ConnectionInit, ConnectionDestroy } = useConnection()

function handleIpcMessages() {
  ipcMain.on('setting', (event: Electron.IpcMainEvent, ...args: any[]) => {
    event.sender.send('setting', ...args)
    const [settingType, lang] = args
    if (settingType === 'lang' && win) {
      menu = Menu.buildFromTemplate(getMenuTemplate(win, lang))
      Menu.setApplicationMenu(menu)
    }
  })
  ipcMain.on('clickUpdate', (event: Electron.IpcMainEvent) => {
    event.sender.send('clickUpdate')
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
  ipcMain.on('startDownloadProgress', (event, updateDetail) => {
    getCurrentLang().then((lang) => {
      autoDownload(event, updateDetail, lang)
    })
  })
  ipcMain.on('showMsg', (event) => {
    dialog.showMessageBox({
      type: 'info',
      title: '',
      buttons: ['OK'],
      message: 'There are currently no updates available.',
    })
  })
  ipcMain.on('insertCodeToEditor', (event, ...args) => {
    event.sender.send('insertCodeToEditor', ...args)
  })
  ipcMain.on('rebuildDatabase', (event) => {
    try {
      rebuildDatabase(ORMConfig.database as string)
      app.relaunch()
      app.exit()
    } catch (error) {
      const err = error as unknown as Error
      dialog.showMessageBox({
        type: 'error',
        title: 'Rebuild Database Error',
        message: 'An error occurred while rebuilding the database.',
        detail: err.message,
      })
    }
  })
  ipcMain.on('installCLI', () => {
    if (win) {
      installCLI(win)
    }
  })
  // Initialize MCP handlers
  initMCPHandlers()
}

// handle event when APP quit
function beforeAppQuit() {
  // close all log appender and rename log file with date
  quitAndRenameLogger()
  // close all SQLite connection
  ConnectionDestroy()
  // cleanup MCP connections
  cleanupMCPConnections()
  // quit APP
  app.quit()
}

async function createWindow() {
  // Init tables and connect to local database.
  try {
    await ConnectionInit({ doMigrations: true } as initOptionModel)
    const { settingService } = useServices()
    await settingService.set()
    const setting = await settingService.get()
    if (setting) {
      theme = setting.currentTheme
      autoCheckUpdate = setting.autoCheck
      syncOsTheme = setting.syncOsTheme
      //@ts-ignore
      global.sharedData = {
        currentTheme: setting.currentTheme,
        currentLang: setting.currentLang,
        autoCheck: setting.autoCheck,
        autoResub: setting.autoResub,
        maxReconnectTimes: setting.maxReconnectTimes,
        syncOsTheme: setting.syncOsTheme,
        multiTopics: setting.multiTopics,
        jsonHighlight: setting.jsonHighlight,
        enableCopilot: setting.enableCopilot,
        openAIAPIHost: setting.openAIAPIHost,
        openAIAPIKey: setting.openAIAPIKey,
        model: setting.model,
        logLevel: setting.logLevel,
        ignoreQoS0Message: setting.ignoreQoS0Message,
      }
    }
  } catch (error) {
    const err = error as unknown as Error
    console.error('ConnectionInit error:', err.toString())
    //@ts-ignore
    global.sharedData = {
      connectDatabaseFailMessage: err.message,
      currentTheme: 'light',
      currentLang: 'en',
      syncOsTheme: false,
    }
  }
  // Create the browser window.
  win = new BrowserWindow({
    ...defaultWindowSize,
    webPreferences: {
      devTools: isDevelopment,
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: isMac ? 'hidden' : 'default',
    backgroundColor: theme === 'dark' ? '#232323' : theme === 'night' ? '#212328' : '#ffffff',
    icon: `${__static}/app.ico`,
  })

  initialize()
  if (win) {
    require('@electron/remote/main').enable(win.webContents)
  }

  // Restore window state
  restoreWindowState(win)

  // Theme change
  onSystemThemeChanged(async (theme) => {
    // @ts-ignore
    if (global.sharedData.syncOsTheme) {
      win?.webContents.send('setting', 'theme', theme)
    }
  })
  // Menu Manger
  // @ts-ignore
  const templateMenu = getMenuTemplate(win, global.sharedData.currentLang)
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

  win.on('close', (e) => {
    // When the window is in full-screen mode, exit full-screen before closing.
    // This ensures that we save the normal (non-full-screen) window bounds.
    // Otherwise, the saved state would be the full-screen bounds,
    // causing the window to restore to full-screen dimensions (covering the entire screen)
    // after leaving full-screen mode in a subsequent launch.
    const mainWindow = win!
    if (mainWindow.isFullScreen()) {
      e.preventDefault()
      mainWindow.once('leave-full-screen', () => {
        saveWindowState(mainWindow)
        mainWindow.close()
      })
      mainWindow.setFullScreen(false)
    } else {
      saveWindowState(mainWindow)
      console.log('App closed')
      beforeAppQuit()
    }
  })
  handleIpcMessages()
  if (electronStore.get('isVersion') !== version) {
    createUpdateWindow()
    electronStore.set('isVersion', version)
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
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
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
