import type { InsertScriptSchema, SelectScriptSchema } from '../schemas/scriptSchema'
import { useScriptSchemaStore } from '@mqttx/ui/stores'
import { eq } from 'drizzle-orm'
import { db } from '../db.renderer'
import { scriptSchema } from '../schemas/scriptSchema'

export default function useScriptSchemaService() {
  const store = useScriptSchemaStore()
  const { scriptSchemas } = storeToRefs(store)
  const { updateScriptSchemas } = store

  async function getAll(): Promise<SelectScriptSchema[]> {
    const result = await db.query.scriptSchema.findMany()
    updateScriptSchemas(result)
    return result
  }
  async function upsert(data: InsertScriptSchema): Promise<SelectScriptSchema> {
    if (!data.id) {
      data.id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    }
    const [inserted] = await db
      .insert(scriptSchema)
      .values(data)
      .onConflictDoUpdate({
        target: scriptSchema.id,
        set: data,
      })
      .returning()
    await getAll()
    return inserted
  }
  async function remove(id: string): Promise<SelectScriptSchema> {
    const [removed] = await db
      .delete(scriptSchema)
      .where(eq(scriptSchema.id, id))
      .returning()
    await getAll()
    return removed
  }
  async function init() {
    await getAll()
  }

  return {
    scriptSchemas,
    updateScriptSchemas,
    getAll,
    upsert,
    remove,
    init,
  }
}
