import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { eq } from 'drizzle-orm'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import icon from '../../resources/icon.png?asset'
import { db, execute, runMigrate } from '../database/db.main'
import { type SelectSettings, settings } from '../database/schemas/settings'

// const IsMacOS = process.platform === 'darwin'

async function createWindow() {
  let data: SelectSettings | undefined
  data = await db.query.settings.findFirst()
  if (!data) {
    await db.insert(settings).values({})
  }
  data = await db.query.settings.findFirst() as SelectSettings

  const width = data.width || 1024
  const height = data.height || 749
  const currentTheme = data.currentTheme || 'light'
  const bgColor = {
    dark: '#232323',
    night: '#212328',
    light: '#ffffff',
  }
  const backgroundColor = bgColor[currentTheme]

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width,
    height,
    minHeight: 650,
    minWidth: 997,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('resize', async () => {
    const { width, height } = mainWindow.getBounds()
    const data = await db.query.settings.findFirst()
    if (data) {
      await db.update(settings).set({ width, height }).where(eq(settings.id, data.id))
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
