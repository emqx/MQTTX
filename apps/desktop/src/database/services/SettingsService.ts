import type { Settings } from 'mqttx'
import type { SelectSettings } from '../schemas/settings'
import { useSettingsStore } from '@mqttx/ui/stores'
import { eq } from 'drizzle-orm'
import { db } from '../db.renderer'
import { settings } from '../schemas/settings'

let watchRegistered = false

export default function useSettingsService() {
  const store = useSettingsStore()
  const { settings: storeSettings } = storeToRefs(store)
  const { updateSettings } = store

  async function getSettingsInDB(): Promise<SelectSettings> {
    return await db.query.settings.findFirst() ?? await updateSettingsInDB()
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
  async function init() {
    if (watchRegistered) return
    const data = await getSettingsInDB()
    updateSettings(data)
    watch(storeSettings, (newSettings) => {
      updateSettingsInDB(newSettings!)
    }, { deep: true })
    watch(() => storeSettings.value?.currentLang, (lang) => {
      if (lang) {
        window.api.store.set('currentLang', lang)
      }
    }, { immediate: true })
    watchRegistered = true
  }

  return {
    settings: storeSettings as Ref<Settings>,
    updateSettings,
    getSettingsInDB,
    updateSettingsInDB,
    init,
  }
}
