import type { Settings } from 'mqttx'
import type { SelectSettings } from '../schemas/settings'
import { useSettingsStore } from '@mqttx/ui/stores'
import { eq } from 'drizzle-orm'
import { db } from '../db.renderer'
import { settings } from '../schemas/settings'

const isWathching = ref(false)

export default function useSettingsService() {
  const { settings: storeSettings, updateSettings } = useSettingsStore()

  async function getSettingsInDB(): Promise<SelectSettings> {
    let data: SelectSettings | undefined
    data = await db.query.settings.findFirst()
    if (!data) {
      data = await updateSettingsInDB()
    }
    updateSettings(data)
    return data
  }
  async function updateSettingsInDB(data?: Partial<Settings>): Promise<SelectSettings> {
    const existingSettings = await db.query.settings.findFirst()
    if (existingSettings) {
      await db.update(settings)
        .set(data ?? {})
        .where(eq(settings.id, existingSettings.id))
    } else {
      await db.insert(settings)
        .values(data ?? {})
    }
    return await getSettingsInDB()
  }

  if (storeSettings) {
    if (!isWathching.value) {
      watch(storeSettings, (newSettings) => {
        updateSettingsInDB(newSettings)
      })
    }
    isWathching.value = true
  }

  return {
    settings: storeSettings!,
    updateSettings,
    getSettingsInDB,
    updateSettingsInDB,
  }
}
