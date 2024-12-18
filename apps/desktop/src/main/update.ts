import type { Lang } from 'mqttx'
import type { SelectSettings } from '../database/schemas/settings'
import type { UpdateEvent } from '../preload/index.d'
import { app, BrowserWindow, ipcMain } from 'electron'
import Store from 'electron-store'
import pkg, { CancellationToken } from 'electron-updater'

// FIXME: https://github.com/sindresorhus/electron-store/issues/276
const store = new Store() as any
const { autoUpdater } = pkg

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

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

async function showReleaseNotesWindow(lang: Lang) {
  const language = ['en', 'zh', 'ja'].includes(lang) ? lang : 'en'
  const version = app.getVersion()
  const link = `https://mqttx.app/${language}/changelogs/v${version}`

  try {
    const response = await fetch(link, { method: 'GET', signal: AbortSignal.timeout(5000) })
    if (response.status !== 200) {
      return
    }
    const releaseNotesWindow = new BrowserWindow({
      width: 600,
      height: 500,
      alwaysOnTop: true,
    })
    releaseNotesWindow.loadURL(link)
  } catch (e) {
    console.error(e)
  }
}

async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch('https://community-sites.emqx.com/api/v1/all_version?product=MQTTX')
    const data = await response.json()
    return data.data?.[0]
  } catch (error) {
    console.error('Failed to get latest version:', error)
    return app.getVersion()
  }
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

let downloadCancelToken: CancellationToken | null = null

function useAppUpdater(settings: SelectSettings) {
  const version = app.getVersion()
  if (store.get('version') !== version) {
    showReleaseNotesWindow(settings.currentLang)
    store.set('version', version)
  }
  ipcMain.handle('check-for-updates', async () => {
    if (process.env.NODE_ENV === 'development') {
      autoUpdater.forceDevUpdateConfig = true
    } else {
      const latestVersion = await getLatestVersion()
      const feedUrl = `https://www.emqx.com/en/downloads/MQTTX/${latestVersion}`
      autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })
    }
    return await autoUpdater.checkForUpdates()
  })
  ipcMain.handle('download-update', async () => {
    downloadCancelToken = new CancellationToken()
    return await autoUpdater.downloadUpdate(downloadCancelToken)
  })
  ipcMain.handle('cancel-download', () => {
    if (downloadCancelToken) {
      downloadCancelToken.cancel()
      downloadCancelToken = null
    }
  })
  ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall()
  })
}

export { useAppUpdater }
