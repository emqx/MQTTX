import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import { Repository, MoreThan, LessThan } from 'typeorm'
import { DateUtils } from 'typeorm/util/DateUtils'
import time, { sqliteDateFormat } from '@/utils/time'
import moment from 'moment'
import _ from 'lodash'

export const MoreThanDate = (date: string | Date) => MoreThan(DateUtils.mixedDateToUtcDatetimeString(date))
export const LessThanDate = (date: string | Date) => LessThan(DateUtils.mixedDateToUtcDatetimeString(date))

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(HistoryConnectionEntity)
    private historyConnectionRepository: Repository<HistoryConnectionEntity>,
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  private entityToModel(data: ConnectionEntity): ConnectionModel {
    return {
      ...data,
      // sort message by Date
      messages:
        data?.messages.sort((a, b) =>
          moment(new Date(a.createAt), sqliteDateFormat).isBefore(new Date(b.createAt)) ? -1 : 1,
        ) ?? [],
      subscriptions:
        data.subscriptions.sort((a, b) =>
          moment(new Date(a.createAt), sqliteDateFormat).isBefore(new Date(b.createAt)) ? -1 : 1,
        ) ?? [],
      will: {
        ...data.will,
        properties: {
          willDelayInterval: data.will?.willDelayInterval,
          payloadFormatIndicator: data.will?.payloadFormatIndicator,
          messageExpiryInterval: data.will?.messageExpiryInterval,
          contentType: data.will?.contentType,
        },
      },
    } as ConnectionModel
  }

  // update connection's collection ID
  public async updateCollectionId(
    id: string | undefined,
    updatedCollectionId: string | null,
  ): Promise<ConnectionModel | undefined> {
    if (!id) return
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    query.parentId = updatedCollectionId
    const updateAt = query.createAt ? query.createAt : time.getNowDate()

    return this.entityToModel(await this.connectionRepository.save({ ...query, updateAt }))
  }

  private deepMerge(target: ConnectionModel, source: ConnectionModel): ConnectionModel {
    const res = _.cloneDeep(target)
    const _deepMerge = (target: ConnectionModel, source: ConnectionModel) => {
      return _.mergeWith(target, source, (target, source, key) => {
        // none empty
        if (!target || !source) {
          return target ? target : source
        }
        // id property , don't merge
        if (key === 'id') {
          return target
        }
        // merge array property
        if (Array.isArray(target) && Array.isArray(source)) {
          const rightIntersection = source.filter((s) => target.findIndex((t) => s.id === t.id) > -1)
          const mergedLeft = target.map((t) => {
            const ri = rightIntersection.find((r) => t.id === r.id)
            if (ri) {
              return _.merge(t, ri)
            }
            return t
          })
          const rightDifference = source.filter((s) => rightIntersection.findIndex((i) => i.id === s.id) === -1)
          return mergedLeft.concat(rightDifference)
        }
        if (source instanceof Object) {
          return {
            ...target,
            ...source,
            id: target.id,
          }
        }
        return source
      })
    }
    _deepMerge(res, source)
    return res
  }

  // cascade update
  public async updateWithCascade(
    id: string,
    data: ConnectionModel,
    args?: Partial<ConnectionEntity>,
  ): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .where('cn.id = :id', { id })
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .getOne()
    const queryModel: ConnectionModel = query ? this.entityToModel(query) : data
    const res: ConnectionModel = this.deepMerge(queryModel, data)
    if (res.will) {
      const {
        id,
        properties = {
          contentType: '',
        },
        lastWillPayload = '',
        lastWillTopic = '',
        lastWillQos = 0,
        lastWillRetain = false,
      } = res.will
      const data: WillEntity = {
        lastWillPayload,
        lastWillTopic,
        lastWillQos,
        lastWillRetain,
        contentType: properties.contentType ? properties.contentType : '',
      }
      if (id) {
        // sync memory to database
        res.will = await this.willRepository.save({
          id,
          ...data,
        } as WillEntity)
      } else {
        // no will relation in database
        res.will = await this.willRepository.save(data as WillEntity)
      }
    } else {
      // no will relation in memory or database
      res.will = await this.willRepository.save({
        contentType: '',
        lastWillPayload: '',
        lastWillTopic: '',
        lastWillQos: 0,
        lastWillRetain: false,
      })
    }
    if (res.subscriptions && Array.isArray(res.subscriptions)) {
      const curSubs: SubscriptionEntity[] = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .where('sub.connectionId = :id', { id })
        .getMany()
      const shouldRemove: SubscriptionEntity[] = curSubs.filter(
        (subInDataBase) => !res.subscriptions.some((subInMemory) => subInMemory.id === subInDataBase.id),
      )
      const shouldUpdate: SubscriptionEntity[] = res.subscriptions.filter((subInMemory) =>
        res.subscriptions.some((subInDataBase) => subInMemory.id === subInDataBase.id),
      )
      await this.subscriptionRepository.remove(shouldRemove)
      if (shouldUpdate && shouldUpdate.length) {
        res.subscriptions = (await this.subscriptionRepository.save(
          shouldUpdate.map((sub) => {
            return {
              id: id,
              ...sub,
              connectionId: undefined,
            } as SubscriptionEntity
          }),
        )) as SubscriptionModel[]
      }
    }
    // TODO: too large cost for message saving, need to refactor
    if (res.messages && Array.isArray(res.messages) && res.messages.length) {
      const shouldSave: MessageEntity[] = res.messages.map((msg) => {
        return {
          ...msg,
          connectionId: undefined,
        } as MessageEntity
      })
      res.messages = await this.messageRepository.save(shouldSave)
    }
    const saved: ConnectionEntity | undefined = await this.connectionRepository.save({
      ...res,
      // TODO: support collection import/export
      parentId: null,
      id,
      ...args,
    } as ConnectionEntity)
    return this.entityToModel(saved)
  }

  public async update(id: string, data: Partial<ConnectionModel>): Promise<ConnectionModel | undefined> {
    const res: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .where('cn.id = :id', { id })
      .getOne()
    if (!res) {
      return
    }
    // safe it's same data struct in single connection table
    const merged = _.merge(res, data)
    const query: ConnectionEntity | undefined = await this.connectionRepository.save({
      ...merged,
      id,
      updateAt: time.getNowDate(),
    } as ConnectionModel)
    return query as ConnectionModel
  }

  public async import(data: ConnectionModel[]): Promise<string> {
    try {
      for (let i = 0; i < data.length; i++) {
        const { id } = data[i]
        if (id) {
          await this.updateWithCascade(id, data[i])
        }
      }
    } catch (err) {
      return err.toString()
    }
    return 'ok'
  }

  // update sequence ID
  public async updateSequenceId(id: string | undefined, updatedOrder: number): Promise<ConnectionModel | undefined> {
    if (!id) return
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    query.orderId = updatedOrder
    await this.connectionRepository.save(query)
    return query as ConnectionModel
  }

  // cascade get
  public async get(id: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .where('cn.id = :id', { id })
      // TODO: remove this query
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .getOne()
    if (query === undefined) {
      return undefined
    }
    return this.entityToModel(query)
  }

  // cascade get
  public async getHistoryByClientID(clientID: string): Promise<Partial<ConnectionModel> | undefined> {
    const query: HistoryConnectionEntity | undefined = await this.historyConnectionRepository
      .createQueryBuilder('cn')
      .where('cn.clientId = :clientID', { clientID })
      .getOne()
    if (query === undefined) {
      return undefined
    }
    return {
      ...query,
      messages: [],
      subscriptions: [],
      isCollection: false,
      will: {
        ...query,
        properties: {
          ...query,
        },
      },
    } as ConnectionModel
  }

  // cascade getAll
  public async getAll(): Promise<ConnectionModel[] | undefined> {
    const query: ConnectionEntity[] | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .getMany()
    if (query === undefined) {
      return undefined
    }
    return query.map((entity) => {
      return this.entityToModel(entity)
    }) as ConnectionModel[]
  }

  public async create(data: ConnectionModel): Promise<ConnectionModel | undefined> {
    const res: ConnectionModel | undefined = data
    let savedWill: WillEntity | undefined
    if (!res.will) {
      savedWill = await this.willRepository.save({
        lastWillPayload: '',
        lastWillQos: 0,
        lastWillRetain: false,
        contentType: '',
      } as WillEntity)
    } else {
      savedWill = await this.willRepository.save(res.will as WillEntity)
    }
    res.will = savedWill
    await this.historyConnectionRepository.save({
      ...res,
      lastWillTopic: res.will.lastWillPayload,
      lastWillPayload: res.will.lastWillPayload,
      lastWillQos: res.will.lastWillQos,
      lastWillRetain: res.will.lastWillRetain,
    } as HistoryConnectionEntity)
    return this.entityToModel(
      await this.connectionRepository.save({
        ...res,
        createAt: time.getNowDate(),
        updateAt: time.getNowDate(),
      } as ConnectionEntity),
    )
  }

  // cascade delete
  public async delete(id: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .where('cn.id = :id', { id })
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .getOne()
    if (!query) {
      return
    }
    query.will?.id && (await this.willRepository.delete(query.will.id))
    await this.connectionRepository.delete({
      id: query.id,
    })
    return this.entityToModel(query) as ConnectionModel
  }

  public async getLeatests(take: number | undefined = 10): Promise<ConnectionModel[] | undefined> {
    const query: HistoryConnectionEntity[] | undefined = await this.historyConnectionRepository
      .createQueryBuilder('cn')
      .addOrderBy('createAt', 'ASC')
      .take(take)
      .getMany()
    if (!query || !Array.isArray(query) || !query.length) {
      return
    }
    return query.map((data: HistoryConnectionEntity) => {
      data.id = undefined
      return {
        ...data,
        messages: [],
        subscriptions: [],
        isCollection: false,
        will: {
          ...data,
          properties: {
            ...data,
          },
        },
        createAt: data?.createAt ?? time.getNowDate(),
        updateAt: data?.updateAt ?? time.getNowDate(),
      }
    })
  }

  public async cleanLeatest() {
    const res: HistoryConnectionEntity[] = await this.historyConnectionRepository.createQueryBuilder().getMany()
    await this.historyConnectionRepository.remove(res)
  }

  public async length() {
    return await this.connectionRepository.createQueryBuilder('cn').select('cn.id').getCount()
  }

  public async getLeatestId(): Promise<string | undefined> {
    const leatest: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .addOrderBy('createAt', 'ASC')
      .select('cn.id')
      .getOne()
    return leatest ? leatest.id : undefined
  }

  public async updateSubscriptions(connectionId: string, subs: SubscriptionModel[]) {
    const query: SubscriptionEntity[] = await this.subscriptionRepository.find({
      connectionId,
    })
    if (!query || !Array.isArray(query) || !query.length) {
      await this.subscriptionRepository.save(subs)
      return
    }
    await this.subscriptionRepository.remove(
      query.filter((subInDb) => !subs.some((subInMemory) => subInMemory.id === subInDb.id)),
    )
    await this.subscriptionRepository.save(
      subs.filter((subInMemory) => query.some((subInDb) => subInMemory.id === subInDb.id)),
    )
  }
}
