import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import CopilotEntity from '../models/CopilotEntity'
import { Repository } from 'typeorm'

@Service()
export default class CopilotService {
  constructor(
    // @ts-ignore
    @InjectRepository(CopilotEntity)
    private conversationRepository: Repository<CopilotEntity>,
  ) {}

  public async create(copilotMessage: CopilotMessage) {
    const newConversation = this.conversationRepository.create(copilotMessage)
    return await this.conversationRepository.save(newConversation)
  }

  public async get(page: number = 1) {
    const count = 6
    const messages = await this.conversationRepository.find({
      skip: (page - 1) * count,
      take: count,
      order: {
        createAt: 'DESC',
      },
    })
    const total = await this.conversationRepository.count()
    const hasMore = total - page * count > 0
    return { messages: messages.reverse(), hasMore }
  }

  public async deleteAll() {
    return await this.conversationRepository.clear()
  }
}
