import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import AgentConversationEntity from '../models/AgentConversationEntity'
import AgentMessageEntity from '../models/AgentMessageEntity'
import time from '@/utils/time'

/**
 * Service for managing agent conversations: the list shown in the Agent sidebar
 */
@Service()
export default class AgentConversationService {
  constructor(
    // @ts-ignore - InjectRepository decorator typing from typeorm-typedi-extensions
    @InjectRepository(AgentConversationEntity)
    private conversationRepository: Repository<AgentConversationEntity>,
    // @ts-ignore - InjectRepository decorator typing from typeorm-typedi-extensions
    @InjectRepository(AgentMessageEntity)
    private messageRepository: Repository<AgentMessageEntity>,
  ) {}

  /** Conversations, most recently updated first */
  public async list(): Promise<AgentConversationEntity[]> {
    return await this.conversationRepository.createQueryBuilder('c').orderBy('c.updateAt', 'DESC').getMany()
  }

  public async create(title = ''): Promise<AgentConversationEntity> {
    return await this.conversationRepository.save({
      title,
      createAt: time.getNowDate(),
      updateAt: time.getNowDate(),
    })
  }

  public async rename(id: string, title: string): Promise<void> {
    await this.conversationRepository.update({ id }, { title, updateAt: time.getNowDate() })
  }

  public async touch(id: string): Promise<void> {
    await this.conversationRepository.update({ id }, { updateAt: time.getNowDate() })
  }

  /** Removes a conversation together with its messages */
  public async delete(id: string): Promise<void> {
    await this.messageRepository.delete({ conversationId: id })
    await this.conversationRepository.delete({ id })
  }
}
