import db from '@/database/index'

export const loadSettings = (): App => {
  return db.get<App>('settings')
}

export const setSettings = (key: string, value: string | boolean): string | boolean => {
  return db.set<string | boolean>(key, value)
}

export default {}
