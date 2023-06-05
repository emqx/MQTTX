import axios from 'axios'
import version from '@/version'
import useServices from '@/database/useServices'

const Store = require('electron-store')
const electronStore = new Store()

export interface versionDetail {
  version: string
  detail: string
}

export const getCurrentLang = async (): Promise<string> => {
  let language: string = 'en'
  const { settingService } = useServices()
  await settingService.set()
  const setting = await settingService.get()
  if (setting) {
    language = setting.currentLang
  }
  return language === 'zh' ? 'zh' : 'en'
}

const getUpdateDtail = async (current: string): Promise<versionDetail | null> => {
  const tagsUrl = 'https://api.github.com/repos/emqx/MQTTX/tags'
  const tagsRes = await axios.get(tagsUrl)
  if (tagsRes.status === 200) {
    const tagsList: string[] = tagsRes.data.map((item: any) => item.name)
    const latestTagsList: string[] = tagsList.slice(0, tagsList.indexOf(current))
    while (latestTagsList.length > 0) {
      const latestVersion = latestTagsList.shift()
      const versionRes = await axios.get(
        `https://community-sites.emqx.com/api/v1/changelogs?product=MQTTX&version=${latestVersion}`,
      )
      if (latestVersion && versionRes.status === 200) {
        return {
          version: latestVersion,
          detail: versionRes.data.data.changelog,
        }
      }
    }
  }
  return null
}

export const updateChecker = async (isAuto: boolean = true): Promise<void | versionDetail | boolean> => {
  const currentVersion = `v${version}`
  const updateDetail: versionDetail | null = await getUpdateDtail(currentVersion)
  const language: string = await getCurrentLang()
  if (updateDetail && (!isAuto || electronStore.get('isIgnore') !== updateDetail.version)) {
    return updateDetail
  }
  return false
}
