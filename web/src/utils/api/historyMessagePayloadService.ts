import db from '@/database/index'
import _ from 'lodash'
import time from '@/utils/time'

class HistoryMessagePayloadService {
  public static MAX_REMAIN_COUNT: number = 10

  public getAll = (): HistoryMessagePayloadModel[] => {
    const query = db.get<HistoryMessagePayloadModel[] | undefined>('payloadsHistory')
    if (!query) {
      return []
    }
    return _.orderBy(query, ['createAt'], ['asc'])
  }

  public create = (data: HistoryMessagePayloadModel): HistoryMessagePayloadModel => {
    if (this.getAll().length >= HistoryMessagePayloadService.MAX_REMAIN_COUNT) {
      const deleteId = this.getAll()[0].id
      if (deleteId !== undefined) {
        this.delete(deleteId)
      }
    }
    return db.insert<HistoryMessagePayloadModel>('payloadsHistory', { ...data, createAt: time.getNowDate() })
  }

  public delete = (id: string): HistoryMessagePayloadModel => {
    return db.remove<HistoryMessagePayloadModel>('payloadsHistory', id)
  }

  public update = (id: string, data: HistoryMessagePayloadModel): HistoryMessagePayloadModel => {
    return db.update<HistoryMessagePayloadModel>('payloadsHistory', id, { ...data, createAt: time.getNowDate() })
  }

  public updateCreateAt = (id: string): HistoryMessagePayloadModel | undefined => {
    const data = db.find<HistoryMessagePayloadModel | undefined>('payloadsHistory', id)
    if (!data) {
      return
    }
    return db.update<HistoryMessagePayloadModel>('payloadsHistory', id, { ...data, createAt: time.getNowDate() })
  }
}

export default new HistoryMessagePayloadService()
