import type { Plugin } from 'vue'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'

// import typings
import type { RxMqttxCollections, RxMqttxDatabase } from './schemas/RxDB'

import scriptFunctionSchema from './schemas/ScriptFunction.schema'
import settingsSchema from './schemas/Settings.schema'

// import modules
import { disableWarnings, RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js'
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
  return window.db ?? inject<RxMqttxDatabase>(KEY_DATABASE)
}

export async function createDatabase(): Promise<Plugin> {
  // wrap the normal storage with the encryption plugin
  const encryptedDexieStorage = wrappedKeyEncryptionCryptoJsStorage({
    storage: getRxStorageDexie(),
  })

  const password = import.meta.env.VITE_WEB_DB_SECRET_KEY ?? 'dah9MVR-nxp.qcw_maj'

  const db = await createRxDatabase<RxMqttxCollections>({
    name: 'mqttx',
    storage: wrappedValidateAjvStorage({
      storage: encryptedDexieStorage,
    }),
    password,
    eventReduce: true,
  })

  window.db = db

  // show leadership in title
  db.waitForLeadership().then(() => {
    document.title = `♛ ${document.title}`
  })

  await db.addCollections({
    'script-function': {
      schema: scriptFunctionSchema,
    },
    'settings': {
      schema: settingsSchema,
    },
  })

  return {
    install(app: any) {
      app.provide(KEY_DATABASE, db)
    },
  }
}
