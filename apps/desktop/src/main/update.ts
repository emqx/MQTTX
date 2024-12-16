import { ipcMain } from 'electron'
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
  console.log('开始检查更新')
})
autoUpdater.on('update-available', () => {
  console.log('有新版本需要更新')
})
autoUpdater.on('update-not-available', () => {
  console.log('无需更新')
})
autoUpdater.on('download-progress', (progressInfo) => {
  console.log('更新进度信息', progressInfo)
})
autoUpdater.on('update-downloaded', () => {
  console.log('更新下载完成')
})
autoUpdater.on('error', (errorMessage) => {
  console.log('更新时出错了', errorMessage)
})

function useAppUpdater() {
  ipcMain.handle('check-for-updates', async () => {
    return await autoUpdater.checkForUpdates()
  })
}

export { useAppUpdater }
