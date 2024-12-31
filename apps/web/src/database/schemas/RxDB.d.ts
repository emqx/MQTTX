import type { RxDatabase } from 'rxdb'
import type { RxScriptFunctionCollection } from './ScriptFunction.schema'
import type { RxSettingsCollection } from './Settings.schema'

export interface RxMqttxCollections {
  'script-function': RxScriptFunctionCollection
  'settings': RxSettingsCollection
}

export type RxMqttxDatabase = RxDatabase<RxMqttxCollections>

declare global {
  interface Window {
    db: RxMqttxDatabase
  }
}
