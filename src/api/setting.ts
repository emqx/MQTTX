import db from '@/database/index'

export const loadSettings = (): App => {
  return db.get<App>('settings')
}

export const setSettings = (key: string, value: string | boolean | number): string | boolean | number => {
  return db.set<string | boolean | number>(key, value)
}

export default {}
