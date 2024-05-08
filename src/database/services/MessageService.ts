import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import MessageEntity from '../models/MessageEntity'
import { Repository } from 'typeorm'

@Service()
export default class MessageService {
  constructor(
    // @ts-ignore
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

  public async get(
    connectionId: string,
    options: {
      page?: number
      limit?: number
      msgType?: MessageType
      topic?: string
      searchParams?: { topic?: string; payload?: string }
    } = {},
  ): Promise<MessagePaginationModel> {
    const defaultOpts = { page: 1, limit: 20, msgType: 'all' }
    const { page, limit, msgType } = { ...defaultOpts, ...options }
    let { topic } = { ...defaultOpts, ...options }

    const total = await this.messageRepository.count({ connectionId })
    const publishedTotal = await this.messageRepository.count({ connectionId, out: true })
    const receivedTotal = await this.messageRepository.count({ connectionId, out: false })

    let query = this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.connectionId = :connection', { connection: connectionId })

    msgType !== 'all' && query.andWhere('msg.out = :out', { out: msgType === 'publish' })

    if (topic && topic !== '#') {
      topic = topic.replace(/[\\%_]/g, '\\$&')
      if (topic.startsWith('$share/')) topic = topic.split('/').slice(2).join('/')
      if (topic.includes('#')) topic = topic.replace('/#', '%')
      /*
        Known Issue: '+' wildcard handling in MQTT topics is incorrect.
        '+' is replaced with '%' for SQL LIKE, causing multi-level match.
          - Incorrect: 'testtopic/+/test' matches 'testtopic/1/2/test'
          - Incorrect: 'testtopic/+/hello/+' can not matches 'testtopic/hello/hello/hello'
        TODO: FIX this issue.
      */
      if (topic.includes('+')) topic = topic.replace('+', '%')
      query.andWhere('msg.topic LIKE :topic ESCAPE "\\"', { topic })
    }

    if (options.searchParams) {
      const { topic, payload } = options.searchParams
      if (topic) {
        query.andWhere('msg.topic LIKE :topic', { topic: `%${topic}%` })
      }
      if (payload) {
        query.andWhere('msg.payload LIKE :payload', { payload: `%${payload}%` })
      }
    }

    const res = await query
      .orderBy('msg.createAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    const list = res.reverse().map((m) => MessageService.entityToModel(m))

    return {
      list,
      total,
      publishedTotal,
      receivedTotal,
      limit,
      page,
    }
  }

  public async loadMore(
    connectionId: string,
    createAt: string,
    mode: 'before' | 'after' = 'before',
    options: {
      limit?: number
      msgType?: MessageType
      topic?: string
      searchParams?: { topic?: string; payload?: string }
    } = {},
  ) {
    const defaultOpts = { limit: 20, msgType: 'all' }
    const { limit, msgType } = { ...defaultOpts, ...options }
    let { topic } = { ...defaultOpts, ...options }

    let query = await this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.connectionId = :connection', { connection: connectionId })

    msgType !== 'all' && query.andWhere('msg.out = :out', { out: msgType === 'publish' })

    if (topic && topic !== '#') {
      topic = topic.replace(/[\\%_]/g, '\\$&')
      if (topic.startsWith('$share/')) topic = topic.split('/').slice(2).join('/')
      if (topic.includes('#')) topic = topic.replace('/#', '%')
      if (topic.includes('+')) topic = topic.replace('+', '%')
      query.andWhere('msg.topic LIKE :topic ESCAPE "\\"', { topic })
    }

    if (options.searchParams) {
      const { topic, payload } = options.searchParams
      if (topic) {
        query.andWhere('msg.topic LIKE :topic', { topic: `%${topic}%` })
      }
      if (payload) {
        query.andWhere('msg.payload LIKE :payload', { payload: `%${payload}%` })
      }
    }

    const res = await query
      .andWhere('msg.createAt ' + (mode === 'before' ? '<' : '>') + ' :createAt', { createAt })
      .orderBy('msg.createAt', mode === 'before' ? 'DESC' : 'ASC')
      .take(limit + 1)
      .getMany()

    mode === 'before' && res.reverse()

    const moreMsg = res.length > limit && mode
    moreMsg && res.pop()

    const list = res.map((m) => MessageService.entityToModel(m))

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

  public async cleanAll(): Promise<void> {
    await this.messageRepository.clear()
  }
}
