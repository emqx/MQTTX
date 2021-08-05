import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import MessageEntity from '../models/MessageEntity'
import { Repository } from 'typeorm'
import ConnectionEntity from '../models/ConnectionEntity'

@Service()
export default class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
  ) {}

  public async updateConnectionMessage(id: string, message: MessageModel): Promise<MessageModel | undefined> {
    const connection: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!connection) {
      return
    }
    const query: MessageEntity = await this.messageRepository.save({
      ...message,
      connection: connection,
    } as MessageEntity)
    if (!query) {
      return
    }
    return query as MessageModel
  }
}
