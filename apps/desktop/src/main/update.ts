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

autoUpdater.on('update-available', async (info) => {
  const releaseNotes = await fetchReleaseNotes(info.version)
  sendUpdateStatus({ status: 'update-available', data: { info, releaseNotes } })
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

async function fetchReleaseNotes(version: string): Promise<string> {
  // TODO: Remove before official release
  version = '1.11.1'
  return fetch(`https://community-sites.emqx.com/api/v1/changelogs?product=MQTTX&version=${version}`)
    .then(response => response.json())
    .then((data) => {
      return data.data?.changelog ?? data.detail
    })
    .catch((error) => {
      return error.message
    })
}

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
