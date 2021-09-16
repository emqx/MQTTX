import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import MessageEntity from '../models/MessageEntity'
import { Repository } from 'typeorm'

@Service()
export default class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  public async pushToConnection(message: MessageModel, connectionId: string): Promise<MessageModel | undefined> {
    const query: MessageEntity | undefined = await this.messageRepository.findOne(message.id)
    if (!query) {
      return await this.messageRepository.save({ ...message, connectionId } as MessageEntity)
    }
    return await this.messageRepository.save({ ...query, ...message, connectionId })
  }

  public async delete(id: string): Promise<MessageModel | undefined> {
    const query = await this.messageRepository.findOne(id)
    if (!query || !query.id) {
      return
    }
    await this.messageRepository.delete(query.id)
    return query
  }

  public async cleanInConnection(connectionId: string): Promise<MessageModel[] | undefined> {
    const query: MessageEntity[] | undefined = await this.messageRepository
      .createQueryBuilder('ms')
      .where('ms.connectionId = :connectionId', { connectionId })
      .getMany()
    if (!query) {
      return
    }
    return await this.messageRepository.remove(query)
  }
}
