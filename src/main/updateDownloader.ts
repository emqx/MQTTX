import axios from 'axios'
import { BrowserWindow, IpcMainEvent, ipcMain } from 'electron'
import version from '@/version'
import { getCurrentLang, versionDetail } from './updateChecker'
import { enable } from '@electron/remote/main'

const { autoUpdater } = require('electron-updater')

export const autoDownload = (event: IpcMainEvent, updateDetail: versionDetail, language: string) => {
  const downloadUrl = `https://www.emqx.com/${language}/downloads/MQTTX/${updateDetail.version}`
  autoUpdater.setFeedURL(downloadUrl)
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.on('update-available', () => {
    autoUpdater.downloadUpdate()
  })
  autoUpdater.on('error', (e: any) => {
    console.log(e)
  })
  autoUpdater.on('download-progress', (progressObj: any) => {
    event.sender.send('downloadProgressPercent', progressObj.percent)
  })
  autoUpdater.on('update-downloaded', () => {
    event.sender.send('downloadProgressPercent', 100)
  })
  ipcMain.on('toQuitAndInstall', () => {
    autoUpdater.quitAndInstall()
  })
  ipcMain.on('cancelDownload', () => {
    autoUpdater.removeAllListeners()
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.autoCheckForUpdates = false
  })
}

export async function createUpdateWindow() {
  const language: string = await getCurrentLang()
  const link: string = `https://mqttx.app/${language === 'zh' ? 'zh/' : ''}changelogs/v${version}`
  // check the network connectivity and then open the window to prevent blank windows
  try {
    const linkRes = await axios.request({
      timeout: 5000,
      method: 'GET',
      url: link,
    })
    if (linkRes.status !== 200) {
      return
    }
    const updateWindow = new BrowserWindow({
      width: 600,
      height: 500,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
    enable(updateWindow.webContents)
    updateWindow.loadURL(link)
  } catch (e) {
    return
  }
}
