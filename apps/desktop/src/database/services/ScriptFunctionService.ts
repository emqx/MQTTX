import type { InsertScriptFunction, SelectScriptFunction } from '../schemas/scriptFunction'
import { useScriptFunctionStore } from '@mqttx/ui/stores'
import { eq } from 'drizzle-orm'
import { db } from '../db.renderer'
import { scriptFunction } from '../schemas/scriptFunction'

export default function useScriptFunctionService() {
  const store = useScriptFunctionStore()
  const { scriptFunctions } = storeToRefs(store)
  const { updateScriptFunctions } = store

  async function getAll(): Promise<SelectScriptFunction[]> {
    const result = await db.query.scriptFunction.findMany()
    updateScriptFunctions(result)
    return result
  }
  async function upsert(data: InsertScriptFunction): Promise<SelectScriptFunction> {
    if (!data.id) {
      data.id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    }
    const [inserted] = await db
      .insert(scriptFunction)
      .values(data)
      .onConflictDoUpdate({
        target: scriptFunction.id,
        set: data,
      })
      .returning()
    await getAll()
    return inserted
  }
  async function remove(id: string): Promise<SelectScriptFunction> {
    const [removed] = await db
      .delete(scriptFunction)
      .where(eq(scriptFunction.id, id))
      .returning()
    await getAll()
    return removed
  }
  async function init() {
    await getAll()
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
