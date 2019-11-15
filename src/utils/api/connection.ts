import db from '@/datastore/index'
import { loadClient, updateClient } from './broker'
import { ConnectionModel, MessageModel } from '@/views/connections/types'
import { ClientModel } from '@/views/brokers/types'

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
  return db.remove<ConnectionModel>('connections', id)
}

export const updateConnection = (id: string, data: ConnectionModel): ConnectionModel => {
  return db.update<ConnectionModel>('connections', id, data)
}

export const updateConnectionMessage = (id: string, message: MessageModel ): ConnectionModel => {
  const connection: ConnectionModel = loadConnection(id)
  connection.messages.push(message)
  return db.update<ConnectionModel>('connections', id, connection)
}

export const updateClientByConnection = (id: string, data: ConnectionModel): ConnectionModel => {
  const client: ClientModel = loadClient(data.clientuuid)
  if (client) {
    client.clientName = data.name
    client.clientId = data.clientId
    client.username = data.username
    client.password = data.password
    client.keepAlive = data.keepalive
    client.cleanSession = data.clean
    updateClient(data.clientuuid, client)
  }
  return db.update<ConnectionModel>('connections', id, data)
}

export default {}
