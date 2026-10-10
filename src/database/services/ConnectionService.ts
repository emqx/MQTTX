import { Service } from 'typedi'
import moment from 'moment'
import MessageEntity from '@/database/models/MessageEntity'
import _ from 'lodash'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import WillEntity from '@/database/models/WillEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import { Repository, MoreThan, LessThan, EntityManager, FindOperator } from 'typeorm'
import { DateUtils } from 'typeorm/util/DateUtils'
import time, { sqliteDateFormat } from '@/utils/time'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import MessageService from './MessageService'
import SubscriptionService from './SubscriptionService'
import WillService from './WillService'
import { ConnectionBackupRecord, readConnectionBackup } from '@/utils/connectionBackup'
import { v4 as uuidv4 } from 'uuid'

const Store = require('electron-store')
const electronStore = new Store()

export const MoreThanDate = (date: string | Date): FindOperator<string> =>
  MoreThan(DateUtils.mixedDateToUtcDatetimeString(date))
export const LessThanDate = (date: string | Date): FindOperator<string> =>
  LessThan(DateUtils.mixedDateToUtcDatetimeString(date))

@Service()
export default class ConnectionService {
  constructor(
    // @ts-ignore - InjectRepository decorator typing from typeorm-typedi-extensions
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    // @ts-ignore - InjectRepository decorator typing from typeorm-typedi-extensions
    @InjectRepository(HistoryConnectionEntity)
    private historyConnectionRepository: Repository<HistoryConnectionEntity>,
    // @ts-ignore - InjectRepository decorator typing from typeorm-typedi-extensions
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
  ) {}

  public static entityToModel(data: ConnectionEntity): ConnectionModel {
    const {
      will,
      // MQTT 5 Properties
      sessionExpiryInterval,
      receiveMaximum,
      maximumPacketSize,
      topicAliasMaximum,
      requestResponseInformation,
      requestProblemInformation,
      userProperties,
      authenticationMethod,
      authenticationData,
      // Other properties to exclude from spread
      pushPropsPayloadFormatIndicator,
      pushPropsMessageExpiryInterval,
      pushPropsTopicAlias,
      pushPropsResponseTopic,
      pushPropsCorrelationData,
      pushPropsUserProperties,
      pushPropsSubscriptionIdentifier,
      pushPropsContentType,
      ...rest
    } = data

    // Handle Will properties
    let willModel: WillModel | undefined
    if (will) {
      const {
        willDelayInterval,
        payloadFormatIndicator,
        messageExpiryInterval,
        contentType,
        responseTopic,
        correlationData,
        userProperties: willUserProps,
        ...willRest
      } = will

      willModel = {
        ...willRest,
        properties: {
          willDelayInterval,
          payloadFormatIndicator,
          messageExpiryInterval,
          contentType,
          responseTopic,
          correlationData,
          userProperties: willUserProps ? JSON.parse(willUserProps) : undefined,
        },
      }
    }

    return {
      ...rest,
      // sort message by Date
      messages:
        data?.messages
          ?.sort((a, b) => (moment(new Date(a.createAt), sqliteDateFormat).isBefore(new Date(b.createAt)) ? -1 : 1))
          .map((entity) => ConnectionService.messageEntityToModel(entity)) ?? [],
      subscriptions:
        data?.subscriptions
          ?.sort((a, b) => (moment(new Date(a.createAt), sqliteDateFormat).isBefore(new Date(b.createAt)) ? -1 : 1))
          .map((sub) => ({
            ...sub,
            userProperties: sub.userProperties ? JSON.parse(sub.userProperties) : undefined,
          })) ?? [],
      will: willModel,
      properties: {
        sessionExpiryInterval,
        receiveMaximum,
        maximumPacketSize,
        topicAliasMaximum,
        requestResponseInformation,
        requestProblemInformation,
        userProperties: userProperties ? JSON.parse(userProperties) : undefined,
        authenticationMethod,
        authenticationData: authenticationData ? Buffer.from(authenticationData, 'utf8') : undefined,
      },
    } as ConnectionModel
  }

  public static modelToEntity(data: Partial<ConnectionModel>): Partial<ConnectionEntity> {
    // Subscriptions and messages are persisted by their own services, strip them here
    const { subscriptions, messages, ...connectionData } = data
    if (connectionData.properties) {
      const {
        sessionExpiryInterval,
        receiveMaximum,
        maximumPacketSize,
        topicAliasMaximum,
        requestResponseInformation,
        requestProblemInformation,
        authenticationMethod,
        authenticationData,
      } = connectionData.properties
      let userProperties = null
      if (connectionData.properties.userProperties) {
        userProperties = JSON.stringify(connectionData.properties.userProperties)
      }
      const { properties, ...rest } = connectionData
      return {
        ...rest,
        sessionExpiryInterval,
        receiveMaximum,
        maximumPacketSize,
        topicAliasMaximum,
        requestResponseInformation,
        requestProblemInformation,
        authenticationMethod,
        authenticationData: authenticationData?.toString('utf8'),
        userProperties,
      }
    }
    return {
      ...connectionData,
    }
  }

  private static messageEntityToModel(entity: MessageEntity): MessageModel {
    const {
      payloadFormatIndicator,
      messageExpiryInterval,
      topicAlias,
      responseTopic,
      correlationData,
      userProperties,
      subscriptionIdentifier,
      contentType,
      ...rest
    } = entity

    return {
      ...rest,
      properties: {
        payloadFormatIndicator,
        messageExpiryInterval,
        topicAlias,
        responseTopic,
        correlationData,
        subscriptionIdentifier,
        contentType,
        userProperties: userProperties ? JSON.parse(userProperties) : undefined,
      },
    } as MessageModel
  }

  // update connection's collection ID
  public async updateCollectionId(
    id: string | undefined,
    updatedCollectionId: string | null,
  ): Promise<ConnectionModel | undefined> {
    if (!id) return
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    query.parentId = updatedCollectionId
    const updateAt = time.getNowDate()
    return ConnectionService.entityToModel(await this.connectionRepository.save({ ...query, updateAt }))
  }

  /**
   * Imports a single connection with the specified ID and data.
   *
   * @param id - The ID of the connection to import.
   * @param data - The data of the connection to import.
   * @param getImportProgress - Optional callback function to receive import progress updates.
   * @returns A Promise that resolves when the import is complete.
   */
  public async importOneConnection(
    id: string,
    data: ConnectionModel,
    getImportOneConnProgress?: (progress: number) => void,
    manager: EntityManager = this.connectionRepository.manager,
  ) {
    const connectionRepository = manager.getRepository(ConnectionEntity)
    const subscriptionService = new SubscriptionService(manager.getRepository(SubscriptionEntity))
    const messageService = new MessageService(manager.getRepository(MessageEntity), connectionRepository)
    let progress = 0
    // Update connection, update subscriptions, and update messages are each considered as a step
    const totalSteps = 3
    // Connection table & Will Message table
    // Child IDs may update this connection's records, but must never move another connection's data.
    for (const [entity, records] of [
      [MessageEntity, data.messages ?? []],
      [SubscriptionEntity, data.subscriptions ?? []],
    ] as const) {
      for (let offset = 0; offset < records.length; offset += 999) {
        const ids = records.slice(offset, offset + 999).flatMap((record) => (record.id ? [record.id] : []))
        if (!ids.length) continue
        const existing = await manager.getRepository(entity).findByIds(ids)
        const conflict = existing.find((record) => record.connectionId !== id)
        if (conflict) throw new Error(`Conflicting child ID: ${conflict.id}`)
      }
    }
    if (data.will?.id) {
      const owner = await connectionRepository.findOne({ where: { will: { id: data.will.id } } })
      if (owner && owner.id !== id) throw new Error(`Conflicting will ID: ${data.will.id}`)
    }
    await this.saveConnection(id, data, manager)
    progress += 1 / totalSteps
    if (getImportOneConnProgress) {
      getImportOneConnProgress(progress)
    }
    // Subscriptions table
    if (Array.isArray(data.subscriptions)) {
      await subscriptionService.updateSubscriptions(id, data.subscriptions)
    }
    progress += 1 / totalSteps
    if (getImportOneConnProgress) {
      getImportOneConnProgress(progress)
    }
    // Messages table
    if (Array.isArray(data.messages) && data.messages.length) {
      await messageService.importMsgsToConnection(data.messages, id, (msgProgress) => {
        if (getImportOneConnProgress) {
          // Combine message import progress with total progress proportionally
          const combinedProgress = progress + msgProgress / totalSteps
          getImportOneConnProgress(combinedProgress)
        }
      })
    } else {
      // No messages to import, mark progress as 100% for this connection
      progress += 1 / totalSteps
      if (getImportOneConnProgress) {
        getImportOneConnProgress(progress)
      }
    }
  }

  private async saveConnection(id: string, data: ConnectionModel, manager: EntityManager): Promise<void> {
    const { will, ...rest } = data
    const savedWill = will && (await manager.getRepository(WillEntity).save(WillService.modelToEntity(will)))
    await manager.getRepository(ConnectionEntity).save({
      ...ConnectionService.modelToEntity(rest),
      will: savedWill ?? undefined,
      updateAt: time.getNowDate(),
      id,
    })
  }

  public async update(id: string, data: ConnectionModel): Promise<ConnectionModel | undefined> {
    try {
      await this.saveConnection(id, data, this.connectionRepository.manager)
      return await this.get(id)
    } catch (error) {
      console.error('Error updating connection:', error)
      return undefined
    }
  }

  /**
   * Imports backup connection data into the database.
   *
   * @param data - Legacy connection records, optionally including JSON collection records.
   * @param getImportAllProgress - A callback function to track the import progress.
   * @returns A Promise that resolves to a string indicating the import status.
   */
  public async import(
    data: ConnectionBackupRecord[],
    getImportAllProgress?: (progress: number) => void,
  ): Promise<string> {
    try {
      const { collections, connections } = readConnectionBackup(data)
      await this.connectionRepository.manager.transaction(async (manager) => {
        const collectionRepository = manager.getRepository(CollectionEntity)
        const connectionRepository = manager.getRepository(ConnectionEntity)
        let completed = 0
        for (const collection of collections) {
          if (await connectionRepository.findOne(collection.id))
            throw new Error(`Conflicting collection ID: ${collection.id}`)
          await collectionRepository.save({
            id: collection.id,
            name: collection.name,
            orderId: collection.orderId,
            isCollection: true,
            parent: collection.parentId ? { id: collection.parentId } : null,
          })
          getImportAllProgress?.(++completed / data.length)
        }
        for (const connection of connections) {
          if (connection.id && (await collectionRepository.findOne(connection.id))) {
            throw new Error(`Conflicting connection ID: ${connection.id}`)
          }
          // Legacy backups contain no collection entities, so dangling parent IDs recover at the root.
          const model = { ...connection, parentId: collections.length ? connection.parentId ?? null : null }
          const id = connection.id ?? uuidv4()
          await this.importOneConnection(
            id,
            model,
            (progress) => getImportAllProgress?.((completed + progress) / data.length),
            manager,
          )
          completed++
        }
      })
      getImportAllProgress?.(1)
    } catch (err) {
      return err instanceof Error ? err.message : String(err)
    }
    return 'ok'
  }

  // update sequence ID
  public async updateSequenceId(id: string | undefined, updatedOrder: number): Promise<ConnectionModel | undefined> {
    if (!id) return
    const query: ConnectionEntity | undefined = await this.connectionRepository.findOne(id)
    if (!query) {
      return
    }
    query.orderId = updatedOrder
    await this.connectionRepository.save(query)
    return query as ConnectionModel
  }

  // cascade get
  public async get(id: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .where('cn.id = :id', { id })
      // TODO: remove this query
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')
      .getOne()
    if (query === undefined) {
      return undefined
    }
    electronStore.set('leatestId', id)
    return ConnectionService.entityToModel(query)
  }

  // cascade get
  public async getHistoryByClientID(clientID: string): Promise<Partial<ConnectionModel> | undefined> {
    const query: HistoryConnectionEntity | undefined = await this.historyConnectionRepository
      .createQueryBuilder('cn')
      .where('cn.clientId = :clientID', { clientID })
      .getOne()
    if (query === undefined) {
      return undefined
    }
    return {
      ...query,
      id: undefined,
      messages: [],
      subscriptions: [],
      isCollection: false,
      will: {
        ...query,
        properties: {
          ...query,
        },
      },
    } as ConnectionModel
  }

  // getAll
  public async getAll() {
    const query: ConnectionEntity[] | undefined = await this.connectionRepository.createQueryBuilder('cn').getMany()
    return query.map((entity) => ConnectionService.entityToModel(entity)) as ConnectionModel[]
  }

  /**
   * Get connections for export without loading messages into memory
   * This method avoids the memory issue by not joining messages table
   * @param id Optional connection ID to get single connection
   * @returns Connections with basic info (subscriptions and will), messages should be streamed separately
   */
  public async getConnectionsForExport(id?: string): Promise<ConnectionModel[]> {
    const query = this.connectionRepository.createQueryBuilder('cn')

    id && query.where('cn.id = :id', { id })

    // Only join subscriptions and will - NO MESSAGES JOIN to avoid memory issues
    query.leftJoinAndSelect('cn.subscriptions', 'sub').leftJoinAndSelect('cn.will', 'will')

    const res = await query.getMany()

    return res.map((entity) => {
      const model = ConnectionService.entityToModel(entity)
      // Initialize empty messages array - will be populated by streaming
      model.messages = []
      return model
    }) as ConnectionModel[]
  }

  public async create(data: ConnectionModel): Promise<ConnectionModel | undefined> {
    const parent = data.parentId
      ? await this.connectionRepository.manager.findOne(CollectionEntity, data.parentId)
      : undefined
    const res: ConnectionModel = { ...data, parentId: parent?.id ?? null }
    let savedWill: WillEntity | undefined
    if (!res.will) {
      savedWill = await this.willRepository.save({
        // TODO: add all will field
        lastWillPayload: '',
        lastWillQos: 0,
        lastWillRetain: false,
        contentType: '',
      })
    } else {
      const {
        properties = {
          contentType: '',
        },
        lastWillPayload = '',
        lastWillTopic = '',
        lastWillQos = 0,
        lastWillRetain = false,
      } = res.will
      const willData: WillEntity = {
        lastWillPayload,
        lastWillTopic,
        lastWillQos,
        lastWillRetain,
        willDelayInterval: properties.willDelayInterval,
        payloadFormatIndicator: properties.payloadFormatIndicator,
        messageExpiryInterval: properties.messageExpiryInterval,
        contentType: properties.contentType,
        responseTopic: properties.responseTopic,
        correlationData: properties.correlationData?.toString(),
      }
      savedWill = await this.willRepository.save(willData)
    }
    res.will = savedWill
    // TODO: refactor historyConnectionRepository field
    const result = await this.historyConnectionRepository.save({
      ...res,
      id: undefined,
      lastWillTopic: res.will.lastWillPayload,
      lastWillPayload: res.will.lastWillPayload,
      lastWillQos: res.will.lastWillQos,
      lastWillRetain: res.will.lastWillRetain,
    } as HistoryConnectionEntity)
    electronStore.set('leatestId', result.id)
    return ConnectionService.entityToModel(
      await this.connectionRepository.save(
        ConnectionService.modelToEntity({
          ...res,
          createAt: time.getNowDate(),
          updateAt: time.getNowDate(),
        }),
      ),
    )
  }

  // cascade delete
  public async delete(id: string): Promise<ConnectionModel | undefined> {
    const query: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .select(['cn.id'])
      .where('cn.id = :id', { id })
      .leftJoinAndSelect('cn.will', 'will')
      .getOne()
    if (!query) {
      return
    }
    query.will?.id && (await this.willRepository.delete(query.will.id))
    await this.connectionRepository.delete({
      id: query.id,
    })
    if (electronStore.get('leatestId') === id) {
      electronStore.set('leatestId', '')
    }
    return ConnectionService.entityToModel(query) as ConnectionModel
  }

  public async getLeatests(take: number | undefined = 10): Promise<ConnectionModel[] | undefined> {
    const query: HistoryConnectionEntity[] | undefined = await this.historyConnectionRepository
      .createQueryBuilder('cn')
      .addOrderBy('createAt', 'ASC')
      .take(take)
      .getMany()
    if (!query || !Array.isArray(query) || !query.length) {
      return
    }
    return query.map((data: HistoryConnectionEntity) => {
      data.id = undefined
      return {
        ...data,
        messages: [],
        subscriptions: [],
        isCollection: false,
        will: {
          ...data,
          properties: {
            ...data,
          },
        },
        createAt: data?.createAt ?? time.getNowDate(),
        updateAt: data?.updateAt ?? time.getNowDate(),
      }
    })
  }

  public async cleanLeatest() {
    const res: HistoryConnectionEntity[] = await this.historyConnectionRepository.createQueryBuilder().getMany()
    await this.historyConnectionRepository.remove(res)
  }

  public async length() {
    return await this.connectionRepository.createQueryBuilder('cn').select('cn.id').getCount()
  }

  public async getLeatestId(): Promise<string | undefined> {
    if (electronStore.get('leatestId')) {
      return electronStore.get('leatestId')
    }
    const leatest: ConnectionEntity | undefined = await this.connectionRepository
      .createQueryBuilder('cn')
      .addOrderBy('createAt', 'ASC')
      .select('cn.id')
      .getOne()
    return leatest?.id
  }

  public async addPushProp(properties: MessageModel['properties'], connectionId: string) {
    if (!properties) return
    const query = await this.connectionRepository.findOne(connectionId)
    if (!query) {
      return
    }
    const updateAt = time.getNowDate()
    this.connectionRepository.update(connectionId, {
      ...query,
      pushPropsPayloadFormatIndicator: properties?.payloadFormatIndicator,
      pushPropsMessageExpiryInterval: properties?.messageExpiryInterval,
      pushPropsTopicAlias: properties?.topicAlias,
      pushPropsResponseTopic: properties?.responseTopic,
      pushPropsCorrelationData: properties?.correlationData?.toString(),
      pushPropsUserProperties: JSON.stringify(properties?.userProperties),
      pushPropsSubscriptionIdentifier: properties?.subscriptionIdentifier,
      pushPropsContentType: properties?.contentType,
      updateAt,
    })
  }

  public async getPushProp(connectionId: string): Promise<MessageModel['properties'] | undefined> {
    const query = await this.connectionRepository.findOne(connectionId)
    if (!query) {
      return
    }
    return {
      payloadFormatIndicator: query.pushPropsPayloadFormatIndicator,
      messageExpiryInterval: query.pushPropsMessageExpiryInterval,
      topicAlias: query.pushPropsTopicAlias,
      responseTopic: query.pushPropsResponseTopic,
      correlationData: query.pushPropsCorrelationData,
      userProperties: query.pushPropsUserProperties ? JSON.parse(query.pushPropsUserProperties) : undefined,
      subscriptionIdentifier: query.pushPropsSubscriptionIdentifier,
      contentType: query.pushPropsContentType,
    } as MessageModel['properties']
  }
}
