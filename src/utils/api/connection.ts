import db from '@/datastore/index'
import { ConnectionModel } from '@/views/connections/types'
import { MqttClient } from 'mqtt'

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

export default {}
