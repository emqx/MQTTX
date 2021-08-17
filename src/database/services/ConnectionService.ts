import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import SettingEntity from '@/database/models/SettingEntity'
import { Repository, MoreThan, LessThan } from 'typeorm'
import { DateUtils } from 'typeorm/util/DateUtils'
import deepMerge from '@/utils/deepMerge'
import time from '@/utils/time'
export const MoreThanDate = (date: string | Date) => MoreThan(DateUtils.mixedDateToUtcDatetimeString(date))
export const LessThanDate = (date: string | Date) => LessThan(DateUtils.mixedDateToUtcDatetimeString(date))

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(SettingEntity)
    private settingRepository: Repository<SettingEntity>,
  ) {}

  // update connection's collection ID
  public async updateCollectionId(id: string, updatedCollectionId: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    query.parentId = updatedCollectionId
    const updateAt = query.createAt ? query.createAt : time.getNowDate()
    await this.connectionRepository.save({ ...query, updateAt })
    return query as ConnectionModel
  }

  public async update(id: string, data: Partial<ConnectionModel>): Promise<ConnectionModel | undefined> {
    let res: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .where('cn.id = :id', { id })
      .getOne()
    if (!res) {
      return
    }
    deepMerge(res, data)
    if (res.will && res.will.id) {
      res.will = await this.willRepository.save(res.will)
    } else {
      // TODO: replace this with default will mdoel
      res.will = await this.willRepository.save({
        lastWillPayload: '',
        lastWillQos: 0,
        lastWillRetain: false,
        contentType: '',
      } as WillEntity)
    }
    if (res.subscriptions) {
      res.subscriptions = await this.subscriptionRepository.save(res.subscriptions)
    }
    if (res.messages) {
      res.messages = await this.messageRepository.save(res.messages)
    }
    const query: ConnectionEntity | undefined = await this.connectionRepository.save({
      ...res,
      updateAt: time.getNowDate(),
    } as ConnectionEntity)
    return query as ConnectionModel
  }

  public async import(data: ConnectionModel[]): Promise<string> {
    try {
      await this.connectionRepository.save(
        data.map((entity: ConnectionEntity) => {
          return {
            ...entity,
            updateAt: time.getNowDate(),
            createAt: entity.createAt ? entity.createAt : time.getNowDate(),
          }
        }) as ConnectionEntity[],
      )
    } catch (err) {
      return err.toString()
    }
    return 'ok'
  }

  // update Sequence ID
  public async updateSequenceId(id: string, updatedOrder: number): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne({
      where: {
        id,
      },
    })
    if (!query) {
      return
    }
    query.orderId = updatedOrder
    await this.connectionRepository.save({
      ...query,
      updateAt: time.getNowDate(),
    })
    return query as ConnectionModel
  }

  public async get(id: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .where('cn.id = :id', { id })
      .getOne()
    if (query === undefined) {
      return undefined
    }
    return query as ConnectionModel
  }

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
    return query as ConnectionModel[]
  }

  public async create(connectionInsertParam: ConnectionModel): Promise<ConnectionModel | undefined> {
    let res: ConnectionModel | undefined = connectionInsertParam
    let savedWill: WillEntity | undefined
    if (!res.will) {
      // TODO: replace this with default will mdoel
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
    return (await this.connectionRepository.save({
      ...res,
      createAt: time.getNowDate(),
      updateAt: time.getNowDate(),
    } as ConnectionEntity)) as ConnectionModel
  }

  public async delete(id: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    const removed: ConnectionEntity = await this.connectionRepository.remove(query)
    return removed as ConnectionEntity
  }

  public async getIDs(): Promise<string[] | undefined> {
    const res: string[] = []
    const query: ConnectionEntity[] | undefined = await this.connectionRepository.find({
      select: ['id'],
    })
    if (!query) {
      return
    }
    query.forEach((entity) => {
      if (entity && entity.id) res.push(entity.id)
    })
    return res as string[]
  }

  public async getLeatest(take: number | undefined = 10): Promise<ConnectionModel[] | undefined> {
    const settings: SettingEntity | undefined = await this.settingRepository.findOne()
    let query: ConnectionEntity[] | undefined
    if (settings && settings.cleanAt) {
      query = await this.connectionRepository
        .createQueryBuilder('cn')
        .where(
          `cn.createAt BETWEEN '${DateUtils.mixedDateToUtcDatetimeString(settings.cleanAt)}' 
        AND '${DateUtils.mixedDateToUtcDatetimeString(time.getNowDate())}'`,
        )
        .addOrderBy('createAt', 'ASC')
        .take(take)
        .getMany()
    } else {
      query = await this.connectionRepository
        .createQueryBuilder('cn')
        .addOrderBy('createAt', 'ASC')
        .take(take)
        .getMany()
      if (!query || !query.length) {
        return
      }
    }
    query.map((entity) => {
      entity.id = undefined
      return entity
    })
    return query
  }

  public async cleanLeatest() {
    const query: SettingEntity | undefined = await this.settingRepository.findOne()
    if (!query) {
      await this.settingRepository.insert({ cleanAt: time.getNowDate() })
    } else {
      await this.settingRepository.save({ ...query, cleanAt: time.getNowDate() })
    }
  }
}
