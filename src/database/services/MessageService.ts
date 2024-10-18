import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import MessageEntity from '../models/MessageEntity'
import { EntityManager, Repository } from 'typeorm'

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

  public handleTopicQuery(query: $TSFixed, topic?: string) {
    if (topic && topic !== '#') {
      // Escape special characters for SQL LIKE
      topic = topic.replace(/[\\%_]/g, '\\$&')

      // Remove $share prefix if present
      if (topic.startsWith('$share/')) {
        topic = topic.split('/').slice(2).join('/')
      }

      /*
        Handle `+` wildcard
        Known Issue: '+' wildcard handling in MQTT topics is incorrect.
        '+' is replaced with '%' for SQL LIKE, causing multi-level match.
          - Incorrect: 'testtopic/+/test' matches 'testtopic/1/2/test'
          - Incorrect: 'testtopic/+/hello/+' can not matches 'testtopic/hello/hello/hello'
        TODO: FIX this issue.
      */
      if (topic.includes('+')) {
        topic = topic.replace('+', '%')
      }

      // Handle '#' wildcard
      if (topic.endsWith('/#')) {
        const baseTopic = topic.slice(0, -2) // Remove '/#'
        query.andWhere('(msg.topic = :baseTopic OR msg.topic LIKE :topic ESCAPE "\\")', {
          baseTopic,
          topic: baseTopic + '/%',
        })
      } else {
        query.andWhere('msg.topic LIKE :topic ESCAPE "\\"', { topic })
      }
    }
    return query
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

    query = this.handleTopicQuery(query, topic)

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

    query = this.handleTopicQuery(query, topic)

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

  private async saveMessages(
    messages: MessageModel[],
    connectionId: string,
  ): Promise<MessageModel | MessageModel[] | undefined> {
    const entities = messages.map((m) => MessageService.modelToEntity(m, connectionId))
    return await this.messageRepository.save(entities)
  }

  public async pushMsgsToConnection(
    message: MessageModel | MessageModel[],
    connectionId: string,
  ): Promise<MessageModel | MessageModel[] | undefined> {
    if (!Array.isArray(message)) {
      return await this.saveMessages([message], connectionId)
    }
    return await this.saveMessages(message, connectionId)
  }

  /**
   * Imports messages to a connection.
   * @param message - The message or array of messages to import.
   * @param connectionId - The ID of the connection.
   * @param getImportMsgsProgress - Optional callback function to track the import progress.
   * @returns A promise that resolves to the imported message(s) or undefined.
   */
  public async importMsgsToConnection(
    message: MessageModel | MessageModel[],
    connectionId: string,
    getImportMsgsProgress?: (progress: number) => void,
  ): Promise<MessageModel | MessageModel[] | undefined> {
    const BATCH_SIZE = 999 // Threshold for batch processing

    const saveMessages = async (messages: MessageModel[]) => {
      const entities = messages.map((m) => MessageService.modelToEntity(m, connectionId))
      return await this.messageRepository.save(entities)
    }

    if (!Array.isArray(message)) {
      // Single message processing
      const result = await saveMessages([message])
      if (getImportMsgsProgress) {
        getImportMsgsProgress(1)
      }
      return result
    }

    // If the number of messages is less than or equal to the batch processing threshold, process directly
    if (message.length <= BATCH_SIZE) {
      const result = await saveMessages(message)
      if (getImportMsgsProgress) {
        getImportMsgsProgress(1)
      }
      return result
    }

    // If the number of messages exceeds the batch processing threshold, perform batch processing
    const results: MessageModel[] = []
    for (let i = 0; i < message.length; i += BATCH_SIZE) {
      const batch = message.slice(i, i + BATCH_SIZE)
      const savedBatch = await saveMessages(batch)
      results.push(...savedBatch)

      // Calculate progress and call callback function
      if (getImportMsgsProgress) {
        const progress = Math.min((i + BATCH_SIZE) / message.length, 1)
        getImportMsgsProgress(progress)
      }
    }
    if (getImportMsgsProgress) {
      getImportMsgsProgress(1)
    }
    return results
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

  public async getOne(id: string): Promise<MessageModel | undefined> {
    const res = await this.messageRepository.findOne(id)
    return res ? MessageService.entityToModel(res) : undefined
  }
}
