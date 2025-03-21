import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import CopilotEntity from '../models/CopilotEntity'
import { Repository } from 'typeorm'

/**
 * Service for managing Copilot conversations in the database
 */
@Service()
export default class CopilotService {
  constructor(
    // @ts-ignore
    @InjectRepository(CopilotEntity)
    private conversationRepository: Repository<CopilotEntity>,
  ) {}

  /**
   * Creates a new Copilot message in the database
   * @param copilotMessage The message to create
   * @returns The saved message entity
   */
  public async create(copilotMessage: CopilotMessage) {
    const newConversation = this.conversationRepository.create(copilotMessage)
    return await this.conversationRepository.save(newConversation)
  }

  /**
   * Retrieves paginated Copilot messages
   * @param page The page number to retrieve (default: 1)
   * @returns Object containing messages and hasMore flag
   */
  public async get(page: number = 1) {
    const count = 20
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

  /**
   * Deletes all Copilot messages from the database
   * @returns The result of the clear operation
   */
  public async deleteAll() {
    return await this.conversationRepository.clear()
  }

  /**
   * Updates an existing Copilot message
   * @param message The message to update
   * @returns The result of the update operation
   */
  public async update(message: CopilotMessage) {
    return await this.conversationRepository.update({ id: message.id }, message)
  }
}
