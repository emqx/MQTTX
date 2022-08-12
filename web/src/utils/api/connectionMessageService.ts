import db from '@/database/index'

class ConnectionMessageService {
  public getAll = (id: string): MessageModel[] => {
    const query = db.find<ConnectionModel>('connections', id)
    if (!query) {
      return []
    }
    return query.messages
  }

  public create = (id: string, message: MessageModel): MessageModel => {
    return db.findChild<$TSFixed>('connections', id).get('messages').insert(message).write()
  }

  public delete = (id: string, mid: string): MessageModel => {
    return db.findChild<$TSFixed>('connections', id).get('messages').removeById(mid).write()
  }
}

export default new ConnectionMessageService()
