import db from '@/database/index'
import { ConnectionModel, MessageModel, ConnectionModelFolder } from '@/views/connections/types'

export const loadConnection = (id: string): ConnectionModel => {
  return db.find<ConnectionModel>('connections', id)
}

export const loadConnections = (): ConnectionModel[] | [] => {
  return db.get<ConnectionModel[] | []>('connections')
}

export const loadSuggestConnections = (): ConnectionModel[] | [] => {
  return db.get<ConnectionModel[] | []>('suggestConnections')
}

export const loadConnectionsWithFolder = (): ConnectionModelFolder[] | [] => {
  return db.get<ConnectionModelFolder[] | []>('connectionsFolder')
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

export const loadAllConnectionsIds = async (type: 'connections' | 'suggestConnections'): Promise<string[]> => {
  const connectionsIds: string[] = []
  let allConnections: ConnectionModel[]
  allConnections = type === 'connections' ? await loadConnections() : await loadSuggestConnections()
  allConnections.forEach((connection: ConnectionModel) => {
    if (connection.id) {
      connectionsIds.push(connection.id)
    }
  })
  return connectionsIds
}

export const createConnection = (data: ConnectionModel): ConnectionModel => {
  loadAllConnectionsIds('suggestConnections').then((res) => {
    if (data.id && res.indexOf(data.id) === -1) {
      createSuggestConnection(data)
    }
  })
  return db.insert<ConnectionModel>('connections', data)
}

export const deleteConnection = (id: string): ConnectionModel => {
  return db.remove<ConnectionModel>('connections', id)
}

export const deleteMessage = (id: string, mid: string): ConnectionModel => {
  return db.findChild<any>('connections', id).get('messages').remove({ mid }).write()
}

export const updateConnection = (id: string, data: ConnectionModel): ConnectionModel => {
  return db.update<ConnectionModel>('connections', id, data)
}

export const updateConnectionMessage = (id: string, message: MessageModel): ConnectionModel => {
  const connection: ConnectionModel = loadConnection(id)
  if (connection) {
    connection.messages.push(message)
  }
  return db.update<ConnectionModel>('connections', id, connection)
}

export const importConnections = (data: ConnectionModel[]): Promise<string> => {
  const importDataResult: Promise<string> = loadAllConnectionsIds('connections')
    .then((res) => {
      try {
        data.forEach((item: ConnectionModel) => {
          const { id } = item
          if (id) {
            if (res.indexOf(id) === -1) {
              createConnection(item)
            } else {
              updateConnection(id, item)
            }
          }
        })
        return 'ok'
      } catch (err) {
        return err.toString()
      }
    })
    .catch((err) => {
      return err.toString()
    })
  return importDataResult
}

export default {}
