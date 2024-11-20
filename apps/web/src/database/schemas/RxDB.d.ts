import type { RxDatabase } from 'rxdb'
import type { RxSettingsCollection } from './Settings.schema'

export interface RxMqttxCollections {
  settings: RxSettingsCollection
}

export type RxMqttxDatabase = RxDatabase<RxMqttxCollections>

declare global {
  interface Window {
    db: RxMqttxDatabase
  }
}
