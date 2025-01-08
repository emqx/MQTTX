import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { scriptFunction } from './schemas/scriptFunction'
import { settings } from './schemas/settings'

const dbPath = import.meta.env.DEV ? 'sqlite.db' : path.join(app.getPath('userData'), 'data.db')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

// TODO: Remove this code before production. This is to ensure the database is recreated on each startup to avoid migration issues during development.
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
}

const sqlite = new Database(
  dbPath,
)

export const db = drizzle(sqlite, { schema: { scriptFunction, settings } })

function toDrizzleResult(row: Record<string, any>)
function toDrizzleResult(rows: Record<string, any> | Array<Record<string, any>>) {
  if (!rows) {
    return []
  }
  if (Array.isArray(rows)) {
    return rows.map((row) => {
      return Object.keys(row).map(key => row[key])
    })
  } else {
    return Object.keys(rows).map(key => rows[key])
  }
}

export async function execute(_e, sqlstr, params, method) {
  const result = sqlite.prepare(sqlstr)
  const ret = result[method](...params)
  return toDrizzleResult(ret)
}

export async function runMigrate() {
  migrate(db, {
    migrationsFolder: path.join(__dirname, '../../drizzle'),
  })
}
