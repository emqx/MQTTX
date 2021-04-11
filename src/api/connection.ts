import db from '@/database/index'
import {
  ConnectionModel,
  MessageModel,
  ConnectionModelCollection,
  HistoryMessageHeaderModel,
  HistoryMessagePayloadModel,
} from '@/views/connections/types'

export const setConnectionCollection = (data: ConnectionModelCollection[] | []): ConnectionModelCollection[] | [] => {
  return db.set<ConnectionModelCollection[] | []>('connectionsCollection', data)
}

export const loadConnectionsWithCollection = (): ConnectionModelCollection[] | [] => {
  return db.get<ConnectionModelCollection[] | []>('connectionsCollection')
}

export const updateConnectionCollectionId = (id: string, collectionId: string | null): ConnectionModel => {
  const connection: ConnectionModel = loadConnection(id)
  if (connection) {
    connection.collectionId = collectionId
  }
  return db.update<ConnectionModel>('connections', id, connection)
}

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
  const suggestConnections = loadSuggestConnections()
  if (suggestConnections.length > 9) {
    const deleteId = suggestConnections[0].id
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

// Message history
export const loadHistoryMessageHeaders = async (): Promise<HistoryMessageHeaderModel[] | []> => {
  return db.get<HistoryMessageHeaderModel[] | []>('historyMessageHeader')
}

export const updateHistoryMessageHeader = (
  id: string,
  headerData: HistoryMessageHeaderModel,
): HistoryMessageHeaderModel => {
  return db.update<HistoryMessageHeaderModel>('historyMessageHeader', id, headerData)
}

export const createHistoryMessageHeader = async (
  data: HistoryMessageHeaderModel,
): Promise<HistoryMessageHeaderModel> => {
  const headers = await loadHistoryMessageHeaders()
  if (headers.length > 9) {
    const deleteId = headers[0].id
    if (deleteId !== undefined) {
      deleteHistoryMessageHeader(deleteId)
    }
  }
  return db.insert<HistoryMessageHeaderModel>('historyMessageHeader', data)
}

export const deleteHistoryMessageHeader = (id: string): HistoryMessageHeaderModel => {
  return db.remove<HistoryMessageHeaderModel>('historyMessageHeader', id)
}

export const loadLatestHistoryMessageHeader = (): HistoryMessageHeaderModel | null => {
  const res: HistoryMessageHeaderModel[] | [] = db.get<HistoryMessageHeaderModel[] | []>('historyMessageHeader')
  return res.length ? res[0] : null
}

//
export const loadLatestHistoryMessagePayload = (): HistoryMessagePayloadModel | null => {
  const res: HistoryMessagePayloadModel[] | [] = db.get<HistoryMessagePayloadModel[] | []>('historyMessagePayload')
  return res.length ? res[0] : null
}

export const loadHistoryMessagePayload = (): HistoryMessagePayloadModel[] | [] => {
  return db.get<HistoryMessagePayloadModel[] | []>('historyMessagePayload')
}

export const updateHistoryMessagePayload = (
  id: string,
  headerData: HistoryMessagePayloadModel,
): HistoryMessagePayloadModel => {
  return db.update<HistoryMessagePayloadModel>('historyMessagePayload', id, headerData)
}

export const createHistoryMessagePayload = (data: HistoryMessagePayloadModel): HistoryMessagePayloadModel => {
  const payloads = loadHistoryMessagePayload()
  if (payloads.length > 9) {
    const deleteId = payloads[0].id
    if (deleteId !== undefined) {
      deleteHistoryMessagePayload(deleteId)
    }
  }
  return db.insert<HistoryMessagePayloadModel>('historyMessagePayload', data)
}

export const deleteHistoryMessagePayload = (id: string): HistoryMessagePayloadModel => {
  return db.remove<HistoryMessagePayloadModel>('historyMessagePayload', id)
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
