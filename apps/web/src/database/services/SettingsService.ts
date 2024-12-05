import type { RxSettingsDocument, RxSettingsDocumentType } from '@/database/schemas/Settings.schema'

import type { Subscription } from 'rxjs'
import { useDatabase } from '@/database'
import { useSettingsStore } from '@mqttx/ui/stores'

export default function useSettingsService() {
  const db = useDatabase()
  const { settings, updateSettings } = useSettingsStore()

  async function getSettingsInDB(): Promise<Subscription> {
    const data = await db.settings.findOne().exec() ?? await updateSettingsInDB()
    const sub = data.$.subscribe((data) => {
      const { ...settings } = data.toJSON()
      updateSettings(settings)
    })
    return sub
  }
  async function updateSettingsInDB(data?: Partial<RxSettingsDocumentType>): Promise<RxSettingsDocument> {
    const id = Math.random().toString(36).substring(2)
    return db.settings.upsert(data ?? { id })
  }

  if (settings) {
    watch(settings, (newSettings) => {
      updateSettingsInDB(newSettings)
    })
  }

  return {
    settings: settings!,
    updateSettings,
    getSettingsInDB,
    updateSettingsInDB,
  }
}
