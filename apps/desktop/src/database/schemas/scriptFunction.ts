import type { ScriptFunction } from 'mqttx'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const scriptFunction = sqliteTable('scriptFunction', {
  id: text().primaryKey(),
  lang: text().$type<ScriptFunction['lang']>().notNull(),
  name: text().notNull(),
  content: text().notNull(),
})

export type SelectScriptFunction = typeof scriptFunction.$inferSelect
export type InsertScriptFunction = typeof scriptFunction.$inferInsert
