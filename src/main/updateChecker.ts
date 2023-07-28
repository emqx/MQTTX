import axios from 'axios'
import version from '@/version'
import useServices from '@/database/useServices'
import { compareVersions } from 'compare-versions'

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
  const tagsUrl = 'https://community-sites.emqx.com/api/v1/all_version?product=MQTTX'
  try {
    const tagsRes = await axios.request({
      timeout: 5000,
      method: 'GET',
      url: tagsUrl,
    })
    if (tagsRes.status === 200) {
      const tagsList: string[] = tagsRes.data.data
      const latestTag: string = tagsList[0]
      if (latestTag && compareVersions(latestTag.replace(/[^0-9.]/g, ''), version) > 0) {
        const versionRes = await axios.request({
          timeout: 5000,
          method: 'GET',
          url: `https://community-sites.emqx.com/api/v1/changelogs?product=MQTTX&version=${latestTag}`,
        })
        if (latestTag && versionRes.status === 200) {
          return {
            version: latestTag,
            detail: versionRes.data.data.changelog,
          }
        }
      }
    }
  } catch (e) {
    // console.log(e)
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
