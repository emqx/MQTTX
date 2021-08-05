import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import HistoryMessageHeaderEntity from '../models/HistoryMessageHeaderEntity'

@Service()
export default class HistoryMessageHeaderService {
  constructor(
    @InjectRepository(HistoryMessageHeaderEntity)
    private messageRepository: Repository<HistoryMessageHeaderEntity>,
  ) {}

  public async loadHistoryMessageHeaders(): Promise<HistoryMessageHeaderModel[] | undefined> {
    const query: HistoryMessageHeaderEntity[] | undefined = await this.messageRepository.find()
    if (!query) {
      return
    }
    return query
  }

  public async deleteHistoryMessageHeader(id: string): Promise<HistoryMessageHeaderModel | undefined> {
    const query = await this.messageRepository.findOne(id)
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }

  public async createHistoryMessageHeader(
    data: HistoryMessageHeaderModel,
  ): Promise<HistoryMessageHeaderModel | undefined> {
    const query: [HistoryMessageHeaderEntity[], number] = await this.messageRepository.findAndCount({
      order: {
        createAt: 'DESC',
      },
    })
    if (query && query[0] && query[1] >= 10) {
      await this.deleteHistoryMessageHeader(query[0][0].id)
    }
    return await this.messageRepository.save(data)
  }

  public async cleanUpHistoryMessageHeader(): Promise<HistoryMessageHeaderModel[] | undefined> {
    const query: HistoryMessageHeaderEntity[] | undefined = await this.messageRepository.find()
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }
}
