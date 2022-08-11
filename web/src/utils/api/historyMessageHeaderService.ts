import db from '@/database/index'
import _ from 'lodash'
import time from '@/utils/time'

class HistoryMessageHeaderService {
  public static MAX_REMAIN_COUNT: number = 10

  public getAll = (): HistoryMessageHeaderModel[] => {
    const query = db.get<HistoryMessageHeaderModel[] | undefined>('headersHistory')
    if (!query) {
      return []
    }
    return _.orderBy(query, ['createAt'], ['asc'])
  }

  public create = (data: HistoryMessageHeaderModel): HistoryMessageHeaderModel => {
    if (this.getAll().length >= HistoryMessageHeaderService.MAX_REMAIN_COUNT) {
      const deleteId = this.getAll()[0].id
      if (deleteId !== undefined) {
        this.delete(deleteId)
      }
    }
    return db.insert<HistoryMessageHeaderModel>('headersHistory', { ...data, createAt: time.getNowDate() })
  }

  public delete = (id: string): HistoryMessageHeaderModel => {
    return db.remove<HistoryMessageHeaderModel>('headersHistory', id)
  }

  public update = (id: string, data: HistoryMessageHeaderModel): HistoryMessageHeaderModel => {
    return db.update<HistoryMessageHeaderModel>('headersHistory', id, { ...data, createAt: time.getNowDate() })
  }

  public updateCreateAt = (id: string): HistoryMessageHeaderModel | undefined => {
    const data = db.find<HistoryMessageHeaderModel | undefined>('headersHistory', id)
    if (!data) {
      return
    }
    return db.update<HistoryMessageHeaderModel>('headersHistory', id, { ...data, createAt: time.getNowDate() })
  }
}

export default new HistoryMessageHeaderService()
