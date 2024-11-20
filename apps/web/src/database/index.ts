import type { Plugin } from 'vue'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'

// import typings
import type { RxMqttxCollections, RxMqttxDatabase } from './schemas/RxDB'

import settingsSchema from './schemas/Settings.schema'

// import modules
import { disableWarnings, RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { RxDBUpdatePlugin } from 'rxdb/plugins/update'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'

const KEY_DATABASE = Symbol('database')

if (import.meta.env.DEV) {
  disableWarnings()
  // in dev-mode we add the dev-mode plugin
  // which does many checks and adds full error messages
  addRxPlugin(RxDBDevModePlugin)
}
addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBUpdatePlugin)

export function useDatabase(): RxMqttxDatabase {
  return inject<RxMqttxDatabase>(KEY_DATABASE) ?? window.db
}

export async function createDatabase(): Promise<Plugin> {
  const db = await createRxDatabase<RxMqttxCollections>({
    name: 'mqttx',
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageDexie(),
    }),
    eventReduce: true,
  })

  // write to window for debugging
  ;(window as any).db = db

  // show leadership in title
  db.waitForLeadership().then(() => {
    document.title = `♛ ${document.title}`
  })

  await db.addCollections({
    settings: {
      schema: settingsSchema,
    },
  })

  return {
    install(app: any) {
      app.provide(KEY_DATABASE, db)
    },
  }
}
