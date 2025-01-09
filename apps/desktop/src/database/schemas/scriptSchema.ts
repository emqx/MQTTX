import type { ScriptSchema } from 'mqttx'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const scriptSchema = sqliteTable('scriptSchema', {
  id: text().primaryKey(),
  codec: text().$type<ScriptSchema['codec']>().notNull(),
  name: text().notNull(),
  content: text().notNull(),
})

export type SelectScriptSchema = typeof scriptSchema.$inferSelect
export type InsertScriptSchema = typeof scriptSchema.$inferInsert
