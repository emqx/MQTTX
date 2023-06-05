import { BrowserWindow, IpcMainEvent, ipcMain } from 'electron'
import version from '@/version'
import { getCurrentLang, versionDetail } from './updateChecker'

const { autoUpdater } = require('electron-updater')
const Store = require('electron-store')
const electronStore = new Store()

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
    electronStore.set('isShow', true)
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
  const updateWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  })
  const language: string = await getCurrentLang()
  let link: string = 'https://mqttx.app'
  link = language === 'zh' ? `${link}/zh` : link
  updateWindow.loadURL(`${link}/changelogs/v${version}`)
  electronStore.set('isShow', false)
}
