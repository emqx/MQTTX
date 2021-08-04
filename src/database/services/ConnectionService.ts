import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '../models/ConnectionEntity'
import { Repository } from 'typeorm'
import deepMerge from '@/utils/deepMerge'

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
  ) {}

  public async updateConnectionCollectionId(
    id: number,
    updatedCollectionId: number,
  ): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne({
      where: {
        id,
      },
    })
    if (!query) {
      return
    }
    query.collection.id = updatedCollectionId
    await this.connectionRepository.save(query)
    const res: ConnectionModel = query
    return res
  }

  public async updateConnection(id: number, data: Partial<ConnectionModel>): Promise<ConnectionModel | undefined> {
    let res: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!res) {
      return
    }
    deepMerge(res, data)
    const query: ConnectionEntity | undefined = await this.connectionRepository.save(res)
    return query
  }

  public async importConnections(data: ConnectionModel[]): Promise<string> {
    try {
      await this.connectionRepository.save(data)
    } catch (err) {
      return err.toString()
    }
    return 'ok'
  }

  public async updateConnectionSequenceId(id: number, updatedOrder: number): Promise<ConnectionModel | undefined> {
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

  public async loadOneConnectionById(id: number): Promise<ConnectionModel | undefined> {
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

  public async loadAllConnections(): Promise<ConnectionModel[] | undefined> {
    const query: ConnectionEntity[] | undefined = await this.connectionRepository.find()
    if (!query) {
      return
    }
    return query as ConnectionModel[]
  }

  public async createConnection(connectionInsertParam: ConnectionModel): Promise<ConnectionModel | undefined> {
    let res: ConnectionModel | undefined = connectionInsertParam
    res = {
      ...res,
      // FIXME: current DB don't need id generator
      id: undefined,
    }
    this.connectionRepository.save(res)
    return res as ConnectionModel
  }

  public async deleteConnectionById(id: number): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    const removed: ConnectionEntity = await this.connectionRepository.remove(query)
    return removed as ConnectionEntity
  }

  public async loadAllConnectionsIds(): Promise<number[] | undefined> {
    const res: number[] = []
    const query: ConnectionEntity[] | undefined = await this.connectionRepository.find({
      select: ['id'],
    })
    if (!query) {
      return
    }
    query.forEach((entity) => {
      if (entity && entity.id) res?.push(entity.id)
    })
    return res as number[]
  }
}
