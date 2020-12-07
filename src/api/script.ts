import db from '@/database/index'
import { ScriptModel } from '@/views/script/types'

export const createScript = (data: ScriptModel): ScriptModel => {
  return db.insert<ScriptModel>('scripts', data)
}

export const loadScripts = (): ScriptModel[] | [] => {
  return db.get<ScriptModel[] | []>('scripts')
}

export const deleteScript = (id: string): ScriptModel => {
  return db.remove<ScriptModel>('scripts', id)
}

export const updateScript = (id: string, data: ScriptModel): ScriptModel => {
  return db.update<ScriptModel>('scripts', id, data)
}

export const loadScript = (id: string): ScriptModel => {
  return db.find<ScriptModel>('scripts', id)
}
