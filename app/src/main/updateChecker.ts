import { dialog, shell } from 'electron'
import axios from 'axios'
import version from '@/version'

const release = 'https://api.github.com/repos/emqx/MQTTX/releases/latest'
const downloadUrl = 'https://github.com/emqx/MQTTX/releases/latest'

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

const updateChecker = async (isAuto: boolean = true): Promise<void | boolean> => {
  const response = await axios.get(release)
  if (response.status === 200) {
    const latest: string = response.data.name
    const isPrerelease: boolean = response.data.prerelease
    if (latest && isUpdate(latest.slice(1, 6), version) && !isPrerelease) {
      dialog
        .showMessageBox({
          type: 'info',
          title: 'New Version',
          buttons: ['Download', 'No'],
          message: `Update available: ${latest}`,
        })
        .then((res) => {
          if (res.response === 0) {
            // if selected yes
            shell.openExternal(downloadUrl)
          }
        })
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

export default updateChecker
