import type { RxScriptFunctionDocumentType } from '@/database/schemas/ScriptFunction.schema'

import type { ScriptFunction } from 'mqttx'
import type { DeepReadonlyObject } from 'rxdb'
import { useDatabase } from '@/database'
import { useScriptFunctionStore } from '@mqttx/ui/stores'

let watchRegistered = false

export default function useScriptFunctionService() {
  const db = useDatabase()
  const store = useScriptFunctionStore()
  const { scriptFunctions } = storeToRefs(store)
  const { updateScriptFunctions } = store

  async function getAll(data?: Partial<RxScriptFunctionDocumentType>): Promise<DeepReadonlyObject<ScriptFunction>[]> {
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
    return formattedData
  }
  async function upsert(data: Omit<RxScriptFunctionDocumentType, 'id'> & { id?: string }): Promise<DeepReadonlyObject<ScriptFunction>> {
    // Generate a unique id starting with a timestamp followed by a random string to ensure default query order and uniqueness
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const result = await db['script-function'].upsert({ id, ...data })
    return result.toJSON()
  }
  async function remove(id: string): Promise<DeepReadonlyObject<ScriptFunction> | null> {
    const result = await db['script-function'].findOne(id).remove()
    return result?.toJSON() ?? null
  }
  async function init() {
    if (watchRegistered) return
    await getAll()
    db['script-function'].$.subscribe(async () => {
      await getAll()
    })
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
