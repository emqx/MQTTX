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
      payloadFormatIndicator: model.props?.payloadFormatIndicator,
      messageExpiryInterval: model.props?.messageExpiryInterval,
      topicAlias: model.props?.topicAlias,
      responseTopic: model.props?.responseTopic,
      correlationData: model.props?.correlationData,
      subscriptionIdentifier: model.props?.subscriptionIdentifier,
      contentType: model.props?.contentType,
      userProperties: JSON.stringify(model.props?.userProperties),
    } as MessageEntity
  }

  public static entityToModel(entity: MessageEntity): MessageModel {
    return {
      ...entity,
      props: {
        ...entity,
        userProperties: entity.userProperties ? JSON.parse(entity.userProperties) : undefined,
      },
    } as MessageModel
  }

  public async pushToConnection(message: MessageModel, connectionId: string): Promise<MessageModel | undefined> {
    const query: MessageEntity | undefined = await this.messageRepository.findOne(message.id)
    if (!query) {
      return await this.messageRepository.save(MessageService.modelToEntity({ ...message }, connectionId))
    }
    return await this.messageRepository.save(MessageService.modelToEntity({ ...query, ...message }, connectionId))
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
    const query: MessageEntity[] | undefined = await this.messageRepository
      .createQueryBuilder('ms')
      .where('ms.connectionId = :connectionId', { connectionId })
      .getMany()
    if (!query || !query.length) {
      return
    }
    const deleteID: string[] = []
    query.forEach((entity) => {
      entity.id && deleteID.push(entity.id)
    })
    if (!deleteID.length) {
      return
    }
    await this.messageRepository.delete(deleteID)
  }
}
