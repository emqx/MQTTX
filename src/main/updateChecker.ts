import { dialog, BrowserWindow } from 'electron'
import axios from 'axios'
import version from '@/version'
import useServices from '@/database/useServices'

const { autoUpdater } = require('electron-updater')
const Store = require('electron-store')
const electronStore = new Store()

const release = 'https://api.github.com/repos/emqx/MQTTX/releases/latest'
let language: string = 'en'

const isUpdate = (latest: string, current: string): boolean => {
  const latestVersion: number[] = latest.split('.').map((item) => parseInt(item, 10))
  const currentVersion: number[] = current.split('.').map((item) => parseInt(item, 10))
  let update: boolean = false

  for (let i: number = 0; i < 3; i++) {
    if (currentVersion[i] < latestVersion[i]) {
      update = true
    }
  }

  return update
}

const autoDownload = (latest: string, language: string): void => {
  const urlLang = language === 'zh' ? 'zh' : 'en'
  const downloadUrl = `https://www.emqx.com/${urlLang}/downloads/MQTTX/${latest}`
  autoUpdater.setFeedURL(downloadUrl)
  autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.on('checking-for-update', () => {})
  autoUpdater.on('update-available', () => {})
  autoUpdater.on('update-not-available', () => {})
  autoUpdater.on('error', () => {})
  autoUpdater.on('download-progress', () => {})
  autoUpdater.on('update-downloaded', () => {
    electronStore.set('isShow', true)
    dialog
      .showMessageBox({
        type: 'info',
        title: 'New Version',
        buttons: ['Install', 'No'],
        message: `Update available: ${latest}`,
      })
      .then((res) => {
        if (res.response === 0) {
          // if selected yes
          autoUpdater.quitAndInstall()
        } else {
          dialog.showMessageBox({
            type: 'info',
            message: 'Automatic update on do not shut down the computer immediately',
          })
        }
      })
  })
}

const updateChecker = async (isAuto: boolean = true): Promise<void | boolean> => {
  const response = await axios.get(release)
  const { settingService } = useServices()
  await settingService.set()
  const setting = await settingService.get()
  if (setting) {
    language = setting.currentLang
  }
  if (response.status === 200) {
    const latest: string = response.data.name
    const isPrerelease: boolean = response.data.prerelease
    if (latest && isUpdate(latest.slice(1, 6), version) && !isPrerelease) {
      autoDownload(latest, language)
    } else {
      if (!isAuto) {
        dialog.showMessageBox({
          type: 'info',
          title: '',
          buttons: ['OK'],
          message: 'There are currently no updates available.',
        })
      }
    }
  } else {
    return false
  }
}
//what's new window
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
  const { settingService } = useServices()
  await settingService.set()
  const setting = await settingService.get()
  if (setting) {
    language = setting.currentLang
  }
  let link: string = 'https://mqttx.app'
  link = language === 'zh' ? `${link}/zh` : link
  updateWindow.loadURL(`${link}/changelogs/v${version}`)
  electronStore.set('isShow', false)
}
export default updateChecker
