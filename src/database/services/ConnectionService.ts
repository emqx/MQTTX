import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '../models/ConnectionEntity'
import WillEntity from '../models/WillEntity'
import SubscriptionEntity from '../models/SubscriptionEntity'
import { Repository } from 'typeorm'
import deepMerge from '@/utils/deepMerge'

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(ConnectionEntity)
    private collectionRepository: Repository<CollectionModel>,
    // TODO: test will & subscript insert issue
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
    @InjectRepository(WillEntity)
    private subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  // update connection's collection ID
  public async updateCollectionId(id: number, updatedCollectionId: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne({
      where: {
        id,
      },
      relations: ['CollectionEntity'],
    })
    if (!query) {
      return
    }
    query.parentId = updatedCollectionId
    await this.connectionRepository.save(query)
    const res: ConnectionModel = query
    return res
  }

  public async update(id: number, data: Partial<ConnectionModel>): Promise<ConnectionModel | undefined> {
    let res: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!res) {
      return
    }
    deepMerge(res, data)
    const query: ConnectionEntity | undefined = await this.connectionRepository.save(res)
    return query as ConnectionModel
  }

  public async import(data: ConnectionModel[]): Promise<string> {
    try {
      await this.connectionRepository.save(data)
    } catch (err) {
      return err.toString()
    }
    return 'ok'
  }

  // update Sequence ID
  public async updateSequenceId(id: number, updatedOrder: number): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne({
      where: {
        id,
      },
    })
    if (!query) {
      return
    }
    query.orderId = updatedOrder
    await this.connectionRepository.save(query)
    return query as ConnectionModel
  }

  public async get(id: number): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne({
      where: {
        id,
      },
    })
    if (query === undefined) {
      return undefined
    }
    return query as ConnectionModel
  }

  public async getAll(): Promise<ConnectionModel[] | undefined> {
    const query: ConnectionEntity[] | undefined = await this.connectionRepository.find()
    if (!query) {
      return
    }
    return query as ConnectionModel[]
  }

  public async create(connectionInsertParam: ConnectionModel): Promise<ConnectionModel | undefined> {
    let res: ConnectionModel | undefined = connectionInsertParam
    res = {
      ...res,
      // FIXME: current DB don't need id generator
      id: undefined,
    }
    this.connectionRepository.save(res)
    return res as ConnectionModel
  }

  public async delete(id: number): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    const removed: ConnectionEntity = await this.connectionRepository.remove(query)
    return removed as ConnectionEntity
  }

  public async getByIDs(): Promise<string[] | undefined> {
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
}
