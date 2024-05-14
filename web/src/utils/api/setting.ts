import db from '@/database/index'

export const loadSettings = (): App => {
  return db.get<App>('settings')
}

export const setSettings = (key: string, value: string | boolean | number): string | boolean | number => {
  return db.set<string | boolean | number>(key, value)
}

export const getAllData = (): $TSFixed => {
  return db.read().value()
}

export const cleanHistoryData = (): void => {
  db.set('connections', [])
  db.set('headersHistory', [])
  db.set('payloadsHistory', [])
  db.set('suggestConnections', [])
}

export default {}
