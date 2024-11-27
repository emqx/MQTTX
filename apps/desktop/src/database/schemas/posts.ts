import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull().default(''),
})

export type SelectPosts = typeof posts.$inferSelect
export type InsertPosts = typeof posts.$inferInsert
