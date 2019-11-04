import db from '@/datastore/index'
import { ConnectionModel } from '@/views/connections/types'

export const loadConnection = (id: string): ConnectionModel => {
  return db.find<ConnectionModel>('connections', id)
}

export const loadConnections = (): ConnectionModel[] | [] => {
  return db.get<ConnectionModel[] | []>('connections')
}

export const createConnections = (data: ConnectionModel): ConnectionModel => {
  return db.insert<ConnectionModel>('connections', data)
}

export const deleteConnection = (id: string): ConnectionModel => {
  return db.remove('connections', id)
}

export default {}
