import type { UpdateEvent } from '../preload/index.d'
import { BrowserWindow, ipcMain } from 'electron'
import pkg from 'electron-updater'

const { autoUpdater } = pkg

if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true
}

autoUpdater.autoDownload = false

// autoUpdater.checkForUpdates()
// autoUpdater.downloadUpdate()
// autoUpdater.quitAndInstall()

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus({ status: 'checking-for-update' })
})
autoUpdater.on('update-available', (info) => {
  sendUpdateStatus({ status: 'update-available', data: info })
})
autoUpdater.on('update-not-available', (info) => {
  sendUpdateStatus({ status: 'update-not-available', data: info })
})
autoUpdater.on('download-progress', (progressInfo) => {
  sendUpdateStatus({ status: 'download-progress', data: progressInfo })
})
autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus({ status: 'update-downloaded', data: info })
})
autoUpdater.on('error', (error) => {
  sendUpdateStatus({ status: 'error', data: error })
})

function sendUpdateStatus(updateEvent: UpdateEvent) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach((window) => {
    if ('data' in updateEvent) {
      window.webContents.send('update-status', updateEvent.status, updateEvent.data)
    } else {
      window.webContents.send('update-status', updateEvent.status)
    }
  })
}

function useAppUpdater() {
  ipcMain.handle('check-for-updates', async () => {
    return await autoUpdater.checkForUpdates()
  })
}

export { useAppUpdater }
