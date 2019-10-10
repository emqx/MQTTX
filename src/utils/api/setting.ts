import db from '@/datastore/index'

export const loadSettings = (): any => {
  return db.get('settings')
}

export const setSettings = (key: string, value: string | boolean): any => {
  return db.set<string | boolean>(key, value)
}

export default {}
