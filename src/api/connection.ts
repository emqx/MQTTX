import db from '@/database/index'

export const loadConnection = (id: string): ConnectionModel => {
  return db.find<ConnectionModel>('connections', id)
}

export const loadConnections = (): ConnectionModel[] | [] => {
  return db.get<ConnectionModel[] | []>('connections')
}

export const loadAllConnectionsIds = async (type: 'connections' | 'suggestConnections'): Promise<string[]> => {
  const connectionsIds: string[] = []
  let allConnections: ConnectionModel[]
  allConnections = await loadConnections()
  allConnections.forEach((connection: ConnectionModel) => {
    if (connection.id) {
      connectionsIds.push(connection.id.toString())
    }
  })
  return connectionsIds
}

export const deleteMessage = (id: string, mid: string): ConnectionModel => {
  return db.findChild<any>('connections', id).get('messages').remove({ mid }).write()
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
            // if (res.indexOf(id.toString()) === -1) {
            //   createConnection(item)
            // } else {
            //   updateConnection(id.toString() as string, item)
            // }
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
