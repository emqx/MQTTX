import type { Settings } from 'mqttx'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { encryptedText } from './encryption'

export const settings = sqliteTable('settings', {
  id: integer().primaryKey({ autoIncrement: true }),
  width: integer({ mode: 'number' }).notNull().default(1024),
  height: integer({ mode: 'number' }).notNull().default(749),
  currentLang: text().$type<Settings['currentLang']>().notNull().default('en'),
  autoCheck: integer({ mode: 'boolean' }).notNull().default(true),
  autoResub: integer({ mode: 'boolean' }).notNull().default(true),
  multiTopics: integer({ mode: 'boolean' }).notNull().default(true),
  maxReconnectTimes: integer().notNull().default(10),
  syncOsTheme: integer({ mode: 'boolean' }).notNull().default(false),
  currentTheme: text().$type<Settings['currentTheme']>().notNull().default('light'),
  jsonHighlight: integer({ mode: 'boolean' }).notNull().default(true),
  logLevel: text().$type<Settings['logLevel']>().notNull().default('info'),
  ignoreQoS0Message: integer({ mode: 'boolean' }).notNull().default(false),
  enableCopilot: integer({ mode: 'boolean' }).notNull().default(true),
  openAIAPIHost: text().notNull().default('https://api.openai.com/v1'),
  openAIAPIKey: encryptedText().notNull().default(''),
  model: text().notNull().default('gpt-4o'),
})

export type SelectSettings = typeof settings.$inferSelect
export type InsertSettings = typeof settings.$inferInsert
