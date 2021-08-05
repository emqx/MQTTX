import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import HistoryMessagePayloadEntity from '../models/HistoryMessagePayloadEntity'

@Service()
export default class HistoryMessagePayloadService {
  constructor(
    @InjectRepository(HistoryMessagePayloadEntity)
    private messageRepository: Repository<HistoryMessagePayloadEntity>,
  ) {}

  public async loadHistoryMessagePayloads(): Promise<HistoryMessagePayloadModel[] | undefined> {
    const query: HistoryMessagePayloadEntity[] | undefined = await this.messageRepository.find()
    if (!query) {
      return
    }
    return query
  }

  public async updateHistoryMessagePayload(
    id: string,
    data: HistoryMessagePayloadModel,
  ): Promise<HistoryMessagePayloadModel | undefined> {
    const query: HistoryMessagePayloadEntity | undefined = await this.messageRepository.findOne(id)
    if (!query) {
      return
    }
    return await this.messageRepository.save({ ...query, data })
  }

  public async deleteHistoryMessageHeader(id: string): Promise<HistoryMessagePayloadModel | undefined> {
    const query = await this.messageRepository.findOne(id)
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }

  public async createHistoryMessageHeader(
    data: HistoryMessagePayloadModel,
  ): Promise<HistoryMessagePayloadModel | undefined> {
    const query: [HistoryMessagePayloadModel[], number] = await this.messageRepository.findAndCount({
      order: {
        createAt: 'DESC',
      },
    })
    if (query) {
      const res = query[0]
      if (res && res[0] && res[0].id && query[1] >= 10) {
        await this.deleteHistoryMessageHeader(res[0].id)
      }
    }
    return await this.messageRepository.save(data)
  }

  public async cleanUpHistoryMessageHeader(): Promise<HistoryMessagePayloadModel[] | undefined> {
    const query: HistoryMessagePayloadEntity[] | undefined = await this.messageRepository.find()
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }
}
