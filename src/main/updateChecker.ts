import { dialog, BrowserWindow } from 'electron'
import axios from 'axios'
import version from '@/version'

const { autoUpdater } = require('electron-updater')
const Store = require('electron-store')
const store = new Store()

const release = 'https://api.github.com/repos/emqx/MQTTX/releases/latest'
/**
 * https://www.emqx.com/en/downloads/MQTTX  英文下载地址
 * https://www.emqx.com/zh/downloads/MQTTX  中文下载地址
 */

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

const autoDownload = (latest: string): void => {
  // autoUpdater.setFeedURL('http://localhost:7070/dist_electron')
  autoUpdater.setFeedURL(`https://www.emqx.com/zh/downloads/MQTTX/${latest}`)
  autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.on('checking-for-update', () => {})
  autoUpdater.on('update-available', () => {})
  autoUpdater.on('update-not-available', () => {})
  autoUpdater.on('error', () => {})
  autoUpdater.on('download-progress', () => {})
  autoUpdater.on('update-downloaded', () => {
    store.set('isShow', true)
    dialog
      .showMessageBox({
        type: 'info',
        title: 'New Version',
        buttons: ['Download', 'No'],
        message: `Update available:${latest}版本`,
      })
      .then((res) => {
        if (res.response === 0) {
          // if selected yes
          autoUpdater.quitAndInstall()
        } else {
          dialog.showMessageBox({
            type: 'info',
            message: '关闭应用时会自动更新,请勿立即关闭计算机',
          })
        }
      })
  })
}

const updateChecker = async (isAuto: boolean = true): Promise<void | boolean> => {
  const response = await axios.get(release)
  if (response.status === 200) {
    const latest: string = response.data.name
    const isPrerelease: boolean = response.data.prerelease
    if (latest && isUpdate(latest.slice(1, 6), version) && !isPrerelease) {
      autoDownload(latest)
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
//生成更新日志的弹窗函数
export function createUpdateWindow(): void {
  const updateWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  })
  let link: string = 'https://mqttx.app'
  updateWindow.loadURL(`${link}/changelogs/v${version}`)
  store.set('isShow', false)
}
export default updateChecker