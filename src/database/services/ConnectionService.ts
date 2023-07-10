import { Service } from 'typedi'
import moment from 'moment'
import _ from 'lodash'
import { InjectRepository } from 'typeorm-typedi-extensions'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import WillEntity from '@/database/models/WillEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import { Repository, MoreThan, LessThan } from 'typeorm'
import { DateUtils } from 'typeorm/util/DateUtils'
import time, { sqliteDateFormat } from '@/utils/time'
import useServices from '@/database/useServices'
const Store = require('electron-store')
const electronStore = new Store()

export const MoreThanDate = (date: string | Date) => MoreThan(DateUtils.mixedDateToUtcDatetimeString(date))
export const LessThanDate = (date: string | Date) => LessThan(DateUtils.mixedDateToUtcDatetimeString(date))

@Service()
export default class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(HistoryConnectionEntity)
    private historyConnectionRepository: Repository<HistoryConnectionEntity>,
    @InjectRepository(WillEntity)
    private willRepository: Repository<WillEntity>,
  ) {}

  public static entityToModel(data: ConnectionEntity): ConnectionModel {
    return {
      ...data,
      // sort message by Date
      messages:
        data?.messages
          ?.sort((a, b) => (moment(new Date(a.createAt), sqliteDateFormat).isBefore(new Date(b.createAt)) ? -1 : 1))
          .map((entity) => ({
            ...entity,
            properties: {
              ...entity,
              userProperties: entity.userProperties ? JSON.parse(entity.userProperties) : undefined,
            },
          })) ?? [],
      subscriptions:
        data?.subscriptions?.sort((a, b) =>
          moment(new Date(a.createAt), sqliteDateFormat).isBefore(new Date(b.createAt)) ? -1 : 1,
        ) ?? [],
      will: {
        ...data.will,
        properties: {
          willDelayInterval: data.will?.willDelayInterval,
          payloadFormatIndicator: data.will?.payloadFormatIndicator,
          messageExpiryInterval: data.will?.messageExpiryInterval,
          contentType: data.will?.contentType,
          responseTopic: data.will?.responseTopic,
          correlationData: data.will?.correlationData,
          userProperties: data.will?.userProperties,
        },
      },
      properties: {
        sessionExpiryInterval: data.sessionExpiryInterval,
        receiveMaximum: data.receiveMaximum,
        maximumPacketSize: data.maximumPacketSize,
        topicAliasMaximum: data.topicAliasMaximum,
        requestResponseInformation: data.requestResponseInformation,
        requestProblemInformation: data.requestProblemInformation,
        userProperties: data.userProperties ? JSON.parse(data.userProperties) : undefined,
        authenticationMethod: data.authenticationMethod,
        authenticationData: data.authenticationData ? Buffer.from(data.authenticationData, 'utf8') : undefined,
      },
    } as ConnectionModel
  }

  public static modelToEntity(data: Partial<ConnectionModel>): Partial<ConnectionEntity> {
    if (data.properties) {
      const {
        sessionExpiryInterval,
        receiveMaximum,
        maximumPacketSize,
        topicAliasMaximum,
        requestResponseInformation,
        requestProblemInformation,
        authenticationMethod,
        authenticationData,
      } = data.properties
      let userProperties = null
      if (data.properties.userProperties) {
        userProperties = JSON.stringify(data.properties.userProperties)
      }
      const { properties, ...rest } = data
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
      ...data,
    }
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
    return ConnectionService.entityToModel(
      await this.connectionRepository.save(ConnectionService.modelToEntity({ ...query, updateAt })),
    )
  }

  // import single connection
  public async importOneConnection(id: string, data: ConnectionModel) {
    const { connectionService, subscriptionService, messageService } = useServices()
    // Connection table & Will Message table
    await connectionService.update(id, data)
    // Subscriptions table
    if (Array.isArray(data.subscriptions) && data.subscriptions.length) {
      await subscriptionService.updateSubscriptions(id, data.subscriptions)
    }
    // Messages table
    if (Array.isArray(data.messages) && data.messages.length) {
      await messageService.pushToConnection(data.messages, id)
    }
  }

  public async update(id: string, data: ConnectionModel) {
    const { willService } = useServices()
    const { messages, subscriptions, will, ...rest } = data
    const savedWill = will && (await willService.save(will))
    await this.connectionRepository.save({
      ...ConnectionService.modelToEntity(rest),
      will: savedWill ?? undefined,
      updateAt: time.getNowDate(),
      id,
    })
    return await this.get(id)
  }

  public async import(data: ConnectionModel[]): Promise<string> {
    try {
      for (let i = 0; i < data.length; i++) {
        const { id } = data[i]
        if (id) {
          // FIXME: remove it after support collection importing
          data[i].parentId = null
          await this.importOneConnection(id, data[i])
        }
      }
    } catch (err) {
      return err as string
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

  // cascade getAll
  public async cascadeGetAll(id?: string) {
    const query = this.connectionRepository.createQueryBuilder('cn')

    id && query.where('cn.id = :id', { id })

    query
      .leftJoinAndSelect('cn.messages', 'msg')
      .leftJoinAndSelect('cn.subscriptions', 'sub')
      .leftJoinAndSelect('cn.will', 'will')

    const res = await query.getMany()

    return res.map((entity) => ConnectionService.entityToModel(entity)) as ConnectionModel[]
  }

  public async create(data: ConnectionModel): Promise<ConnectionModel | undefined> {
    const res: ConnectionModel | undefined = data
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
