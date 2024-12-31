import type { RxScriptFunctionDocument, RxScriptFunctionDocumentType } from '@/database/schemas/ScriptFunction.schema'

import { useDatabase } from '@/database'
import { useScriptFunctionStore } from '@mqttx/ui/stores'

let watchRegistered = false

export default function useScriptFunctionService() {
  const db = useDatabase()
  const store = useScriptFunctionStore()
  const { scriptFunctions } = storeToRefs(store)
  const { updateScriptFunctions } = store

  async function getAll(data?: Partial<RxScriptFunctionDocumentType>): Promise<RxScriptFunctionDocument[]> {
    let query = db['script-function'].find()
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          query = query.where(key).eq(value)
        }
      }
    }
    const result = await query.exec()
    const formattedData = result.map(item => item.toJSON())
    updateScriptFunctions(formattedData)
    return result
  }
  async function upsert(data: Partial<RxScriptFunctionDocumentType>): Promise<RxScriptFunctionDocument> {
    const id = Math.random().toString(36).substring(2)
    return db['script-function'].upsert({ id, ...data })
  }
  async function remove(id: string): Promise<RxScriptFunctionDocument | null> {
    return await db['script-function'].findOne(id).remove()
  }

  async function init() {
    if (watchRegistered) return
    await getAll()
    db['script-function'].$.subscribe(async () => await getAll())
    watchRegistered = true
  }

  return {
    scriptFunctions,
    updateScriptFunctions,
    getAll,
    upsert,
    remove,
    init,
  }
}
