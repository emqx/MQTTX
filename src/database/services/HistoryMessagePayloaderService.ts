import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import time from '../../utils/time'
import HistoryMessagePayloadEntity from '../models/HistoryMessagePayloadEntity'

@Service()
export default class HistoryMessagePayloadService {
  constructor(
    // @ts-ignore
    @InjectRepository(HistoryMessagePayloadEntity)
    private messageRepository: Repository<HistoryMessagePayloadEntity>,
  ) {}

  public static MAX_REMAIN_COUNT: number = 10

  public async getAll(): Promise<HistoryMessagePayloadModel[] | undefined> {
    const query: HistoryMessagePayloadEntity[] | undefined = await this.messageRepository
      .createQueryBuilder('pld')
      .addOrderBy('createAt', 'ASC')
      .getMany()
    if (!query) {
      return
    }
    return query
  }

  public async updateCreateAt(id: string): Promise<HistoryMessagePayloadModel | undefined> {
    const query: HistoryMessagePayloadEntity | undefined = await this.messageRepository.findOne(id)
    if (!query) {
      return
    }
    return await this.messageRepository.save({ ...query, createAt: time.getNowDate() })
  }

  public async update(id: string, data: HistoryMessagePayloadModel): Promise<HistoryMessagePayloadModel | undefined> {
    const query: HistoryMessagePayloadEntity | undefined = await this.messageRepository.findOne(id)
    if (!query) {
      return
    }
    return await this.messageRepository.save({ ...query, data })
  }

  public async delete(id: string): Promise<HistoryMessagePayloadModel | undefined> {
    const query = await this.messageRepository.findOne(id)
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }

  public async create(data: HistoryMessagePayloadModel): Promise<HistoryMessagePayloadModel | undefined> {
    const query: [HistoryMessagePayloadModel[], number] = await this.messageRepository.findAndCount({
      order: {
        createAt: 'DESC',
      },
    })
    if (query) {
      const res = query[0]
      if (res && res[0] && res[0].id && query[1] >= HistoryMessagePayloadService.MAX_REMAIN_COUNT) {
        await this.delete(res[0].id)
      }
    }
    return await this.messageRepository.save(data)
  }

  public async clean(): Promise<HistoryMessagePayloadModel[] | undefined> {
    const query: HistoryMessagePayloadEntity[] | undefined = await this.messageRepository.find()
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }
}
