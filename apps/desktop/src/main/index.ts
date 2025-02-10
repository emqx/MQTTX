import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import contextMenu from 'electron-context-menu'
import debug from 'electron-debug'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import icon from '../../resources/icon.png?asset'
import { db, execute, runMigrate } from '../database/db.main'
import { type SelectSettings, settings } from '../database/schemas/settings'
import { contextMenuConfig, defaultWindowSize, restoreWindowState, saveWindowState, setMenu } from './config'
import { useInstallCLI } from './installCLI'
import { useStore } from './store'
import { useAppUpdater } from './update'

debug()

contextMenu(contextMenuConfig)

// const IsMacOS = process.platform === 'darwin'

let existingSettings: SelectSettings | undefined

async function createWindow() {
  if (is.dev) {
    installExtension(VUEJS_DEVTOOLS)
      .catch(err => console.error('An error occurred: ', err))
  }

  existingSettings = await db.query.settings.findFirst()
  if (!existingSettings) {
    await db.insert(settings).values({})
  }
  existingSettings = await db.query.settings.findFirst() as SelectSettings

  const currentTheme = existingSettings.currentTheme || 'light'
  const bgColor = {
    dark: '#232323',
    night: '#212328',
    light: '#ffffff',
  }
  const backgroundColor = bgColor[currentTheme]

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    ...defaultWindowSize,
    show: false,
    autoHideMenuBar: true,
    backgroundColor,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
    // TODO: https://github.com/electron/electron/issues/43125
    // titleBarStyle: IsMacOS ? 'hidden' : 'default',
  })

  // Restore window state
  restoreWindowState(mainWindow)

  setMenu()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', async (e) => {
    // When the window is in full-screen mode, exit full-screen before closing.
    // This ensures that we save the normal (non-full-screen) window bounds.
    // Otherwise, the saved state would be the full-screen bounds,
    // causing the window to restore to full-screen dimensions (covering the entire screen)
    // after leaving full-screen mode in a subsequent launch.
    if (mainWindow.isFullScreen()) {
      e.preventDefault()
      mainWindow.once('leave-full-screen', () => {
        saveWindowState(mainWindow)
        mainWindow.close()
      })
      mainWindow.setFullScreen(false)
    } else {
      saveWindowState(mainWindow)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('db:execute', execute)

  await runMigrate()

  await createWindow()

  useStore()

  useAppUpdater(existingSettings!)

  useInstallCLI()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
