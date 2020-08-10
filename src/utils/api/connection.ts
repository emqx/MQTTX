import db from '@/database/index'
import { ConnectionModel, MessageModel } from '@/views/connections/types'

export const loadConnection = (id: string): ConnectionModel => {
  return db.find<ConnectionModel>('connections', id)
}

export const loadConnections = (): ConnectionModel[] | [] => {
  return db.get<ConnectionModel[] | []>('connections')
}

export const loadSuggestConnections = (): ConnectionModel[] | [] => {
  return db.get<ConnectionModel[] | []>('suggestConnections')
}

export const createSuggestConnection = (data: ConnectionModel): ConnectionModel => {
  if (loadSuggestConnections().length > 9) {
    const deleteId = loadSuggestConnections()[0].id
    if (deleteId !== undefined) {
      deleteSuggestConnection(deleteId)
    }
  }
  return db.insert<ConnectionModel>('suggestConnections', data)
}

export const deleteSuggestConnection = (id: string): ConnectionModel => {
  return db.remove<ConnectionModel>('suggestConnections', id)
}

export const createConnection = (data: ConnectionModel): ConnectionModel => {
  createSuggestConnection(data)
  return db.insert<ConnectionModel>('connections', data)
}

export const deleteConnection = (id: string): ConnectionModel => {
  return db.remove<ConnectionModel>('connections', id)
}

export const updateConnection = (id: string, data: ConnectionModel): ConnectionModel => {
  return db.update<ConnectionModel>('connections', id, data)
}

export const updateConnectionMessage = (id: string, message: MessageModel): ConnectionModel => {
  const connection: ConnectionModel = loadConnection(id)
  connection.messages.push(message)
  return db.update<ConnectionModel>('connections', id, connection)
}

export default {}
