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

  public static modelToEntity(model: MessageModel, connectionId: string | undefined): MessageEntity {
    return {
      ...model,
      connectionId,
      payloadFormatIndicator: model.properties?.payloadFormatIndicator,
      messageExpiryInterval: model.properties?.messageExpiryInterval,
      topicAlias: model.properties?.topicAlias,
      responseTopic: model.properties?.responseTopic,
      correlationData: model.properties?.correlationData,
      subscriptionIdentifier: model.properties?.subscriptionIdentifier,
      contentType: model.properties?.contentType,
      userProperties: JSON.stringify(model.properties?.userProperties),
    } as MessageEntity
  }

  public static entityToModel(entity: MessageEntity): MessageModel {
    return {
      ...entity,
      properties: {
        ...entity,
        userProperties: entity.userProperties ? JSON.parse(entity.userProperties) : undefined,
      },
    } as MessageModel
  }

  public async get(connectionId: string, page = 1, limit = 20): Promise<MessagePaginationModel> {
    const total = await this.messageRepository.count({ connectionId })
    const publishedTotal = await this.messageRepository.count({ connectionId, out: true })
    const receivedTotal = await this.messageRepository.count({ connectionId, out: false })
    const query = await this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.connectionId = :connection', { connection: connectionId })
      .orderBy('msg.createAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()
    const messages = query.reverse().map((m) => MessageService.entityToModel(m))
    return {
      list: messages,
      total,
      publishedTotal,
      receivedTotal,
      limit,
      page,
    }
  }

  public async getMore(connectionId: string, createAt: string, mode: 'before' | 'after' = 'before', limit = 20) {
    const query = await this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.connectionId = :connection', { connection: connectionId })
      .andWhere('msg.createAt ' + (mode === 'before' ? '<' : '>') + ' :createAt', { createAt })
      .orderBy('msg.createAt', mode === 'before' ? 'DESC' : 'ASC')
      .take(limit + 1)
      .getMany()
    mode === 'before' && query.reverse()
    const moreMsg = query.length > limit && mode
    moreMsg && query.pop()
    const list = query.map((m) => MessageService.entityToModel(m))
    return { list, moreMsg }
  }

  public async pushToConnection(
    message: MessageModel | MessageModel[],
    connectionId: string,
  ): Promise<MessageModel | MessageModel[] | undefined> {
    if (!Array.isArray(message)) {
      return await this.messageRepository.save(MessageService.modelToEntity({ ...message }, connectionId))
    } else {
      const res = message.map((m) => MessageService.modelToEntity(m, connectionId))
      return await this.messageRepository.save(res)
    }
  }

  public async delete(id: string): Promise<MessageModel | undefined> {
    const query = await this.messageRepository.findOne(id)
    if (!query || !query.id) {
      return
    }
    await this.messageRepository.delete(query.id)
    return query
  }

  public async cleanInConnection(connectionId: string) {
    await this.messageRepository
      .createQueryBuilder()
      .delete()
      .where('connectionId = :connectionId', { connectionId })
      .execute()
  }
}
