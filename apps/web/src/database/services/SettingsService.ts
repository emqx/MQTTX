import type { RxSettingsDocument, RxSettingsDocumentType } from '@/database/schemas/Settings.schema'

import type { Settings } from 'mqttx'
import { useDatabase } from '@/database'
import { useSettingsStore } from '@mqttx/ui/stores'

let watchRegistered = false

export default function useSettingsService() {
  const db = useDatabase()
  const store = useSettingsStore()
  const { settings } = storeToRefs(store)
  const { updateSettings } = store

  async function getSettingsInDB(): Promise<RxSettingsDocument> {
    return await db.settings.findOne().exec() ?? await updateSettingsInDB()
  }
  async function updateSettingsInDB(data?: Partial<RxSettingsDocumentType>): Promise<RxSettingsDocument> {
    const id = Math.random().toString(36).substring(2)
    return db.settings.upsert(data ?? { id })
  }
  async function init() {
    if (watchRegistered) return
    const data = await getSettingsInDB()
    const { ...formattedData } = data.toJSON()
    updateSettings(formattedData)
    watch(settings, (newSettings) => {
      updateSettingsInDB(newSettings!)
    }, { deep: true })
    watchRegistered = true
  }

  return {
    settings: settings as Ref<Settings>,
    updateSettings,
    getSettingsInDB,
    updateSettingsInDB,
    init,
  }
}
