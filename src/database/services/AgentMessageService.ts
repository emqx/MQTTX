import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import AgentMessageEntity from '../models/AgentMessageEntity'
import { Repository } from 'typeorm'
import { AgentMessage } from '@/types/agent'
/**
 * Service for managing Agent conversations in the database
 */
@Service()
export default class AgentMessageService {
  constructor(
    // @ts-ignore - InjectRepository decorator typing from typeorm-typedi-extensions
    @InjectRepository(AgentMessageEntity)
    private conversationRepository: Repository<AgentMessageEntity>,
  ) {}

  /**
   * Creates a new Agent message in the database
   * @param agentMessage The message to create
   * @returns The saved message entity
   */
  public async create(agentMessage: AgentMessage) {
    const newConversation = this.conversationRepository.create(agentMessage)
    return await this.conversationRepository.save(newConversation)
  }

  /**
   * Retrieves paginated messages of one conversation
   * @param conversationId The conversation to read
   * @param page The page number to retrieve (default: 1)
   * @returns Object containing messages and hasMore flag
   */
  public async get(conversationId: string, page = 1) {
    const count = 20
    // createAt only has second precision, so rowid breaks ties in insertion order
    const messages = await this.conversationRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createAt', 'DESC')
      .addOrderBy('message.rowid', 'DESC')
      .skip((page - 1) * count)
      .take(count)
      .getMany()
    const total = await this.conversationRepository.count({ conversationId })
    const hasMore = total - page * count > 0
    return { messages: messages.reverse(), hasMore }
  }

  /**
   * Deletes a single message
   */
  public async delete(id: string) {
    return await this.conversationRepository.delete({ id })
  }

  /**
   * Updates an existing Agent message
   * @param message The message to update
   * @returns The result of the update operation
   */
  public async update(message: AgentMessage) {
    // `parts` is stored as simple-json, which TypeORM cannot type through QueryDeepPartialEntity
    return await this.conversationRepository.update({ id: message.id }, message as any)
  }
}
