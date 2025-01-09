import type { RxScriptSchemaDocumentType } from '@/database/schemas/ScriptSchema.schema'

import type { ScriptSchema } from 'mqttx'
import type { DeepReadonlyObject } from 'rxdb'
import { useDatabase } from '@/database'
import { useScriptSchemaStore } from '@mqttx/ui/stores'

let watchRegistered = false

export default function useScriptSchemaService() {
  const db = useDatabase()
  const store = useScriptSchemaStore()
  const { scriptSchemas, protobufSchemas, avroSchemas } = storeToRefs(store)
  const { updateScriptSchemas } = store

  async function getAll(data?: Partial<RxScriptSchemaDocumentType>): Promise<DeepReadonlyObject<ScriptSchema>[]> {
    let query = db['script-schema'].find()
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          query = query.where(key).eq(value)
        }
      }
    }
    const result = await query.exec()
    const formattedData = result.map(item => item.toJSON())
    updateScriptSchemas(formattedData)
    return formattedData
  }
  async function upsert(data: Omit<RxScriptSchemaDocumentType, 'id'> & { id?: string }): Promise<DeepReadonlyObject<ScriptSchema>> {
    // Generate a unique id starting with a timestamp followed by a random string to ensure default query order and uniqueness
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const result = await db['script-schema'].upsert({ id, ...data })
    return result.toJSON()
  }
  async function remove(id: string): Promise<DeepReadonlyObject<ScriptSchema> | null> {
    const result = await db['script-schema'].findOne(id).remove()
    return result?.toJSON() ?? null
  }
  async function init() {
    if (watchRegistered) return
    await getAll()
    db['script-schema'].$.subscribe(async () => {
      await getAll()
    })
    watchRegistered = true
  }

  return {
    scriptSchemas,
    protobufSchemas,
    avroSchemas,
    updateScriptSchemas,
    getAll,
    upsert,
    remove,
    init,
  }
}
