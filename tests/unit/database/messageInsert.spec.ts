import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, Logger, Repository } from 'typeorm'
import MessageService from '@/database/services/MessageService'
import MessageEntity from '@/database/models/MessageEntity'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import WillEntity from '@/database/models/WillEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import TopicNodeEntity from '@/database/models/TopicNodeEntity'

const CONNECTION_ID = 'message-insert-connection'
const makeMessage = (index: number): MessageModel => ({
  id: `message_${index}`,
  createAt: '2026-01-01T00:00:00.000Z',
  out: false,
  payload: `payload ${index}`,
  qos: 0,
  retain: false,
  topic: 'test/messages',
})

describe('MessageService live inserts (SQLite)', () => {
  let database: Connection
  let repository: Repository<MessageEntity>
  let service: MessageService
  let queries: string[]

  beforeEach(async () => {
    queries = []
    const logger: Logger = {
      logQuery: (query) => queries.push(query),
      logQueryError() {},
      logQuerySlow() {},
      logSchemaBuild() {},
      logMigration() {},
      log() {},
    }
    database = await createConnection({
      name: 'message-insert',
      type: 'sqlite',
      database: ':memory:',
      entities: [ConnectionEntity, CollectionEntity, WillEntity, MessageEntity, SubscriptionEntity, TopicNodeEntity],
      synchronize: true,
      logger,
    })
    repository = database.getRepository(MessageEntity)
    const connectionRepository = database.getRepository(ConnectionEntity)
    service = new MessageService(repository, connectionRepository)
    await connectionRepository.save({
      id: CONNECTION_ID,
      clientId: 'client',
      name: 'test',
      clean: true,
      protocol: 'mqtt',
      host: 'localhost',
      port: 1883,
      keepalive: 60,
      connectTimeout: 10,
      reconnect: false,
      reconnectPeriod: 4000,
      username: '',
      password: '',
      path: '',
      certType: '',
      ssl: false,
      mqttVersion: '5.0',
      unreadMessageCount: 0,
      ca: '',
      cert: '',
      key: '',
      isCollection: false,
    } as ConnectionEntity)
    queries.length = 0
  })

  afterEach(async () => {
    if (database?.isConnected) await database.close()
  })

  it('stores all 1000 messages in a batch', async () => {
    const messages = Array.from({ length: 1000 }, (_, index) => makeMessage(index))
    await service.pushMsgsToConnection(messages, CONNECTION_ID)
    expect(await repository.count({ connectionId: CONNECTION_ID })).to.equal(1000)
    const saved = await repository.find({ connectionId: CONNECTION_ID })
    expect(saved.map((message) => message.id).sort()).to.deep.equal(messages.map((message) => message.id).sort())
  })

  it('stores all 201 messages from overlapping batch and single-message pushes', async () => {
    await Promise.all([
      service.pushMsgsToConnection(
        Array.from({ length: 200 }, (_, index) => makeMessage(index)),
        CONNECTION_ID,
      ),
      service.pushMsgsToConnection(makeMessage(200), CONNECTION_ID),
    ])
    expect(await repository.count({ connectionId: CONNECTION_ID })).to.equal(201)
  })

  it('round-trips every column and MQTT 5 properties like save(), including a single message', async () => {
    const message: MessageModel = {
      ...makeMessage(1),
      out: true,
      qos: 2,
      retain: true,
      payload: '{"temperature":23,"unit":"°C"}',
      meta: '{"gzipDecompressed":true,"type":"JSON"}',
      properties: {
        payloadFormatIndicator: true,
        messageExpiryInterval: 60,
        topicAlias: 7,
        responseTopic: 'test/replies',
        correlationData: 'correlation-123',
        subscriptionIdentifier: 42,
        contentType: 'application/json',
        userProperties: { source: 'sensor', labels: ['温度', '室内'] },
      },
    }
    const messages = [message, makeMessage(2)]
    await repository.save(messages.map((model) => MessageService.modelToEntity(model, CONNECTION_ID)))
    const expectedEntities = await repository.find({ order: { id: 'ASC' } })
    const expectedHistory = await service.get(CONNECTION_ID)
    await repository.clear()

    for (const model of messages) await service.pushMsgsToConnection(model, CONNECTION_ID)

    expect(await repository.find({ order: { id: 'ASC' } })).to.deep.equal(expectedEntities)
    expect(await service.get(CONNECTION_ID)).to.deep.equal(expectedHistory)
    const saved = (await service.getOne(message.id!))!
    expect(saved.properties).to.deep.equal(message.properties)
    expect(saved.meta).to.equal(message.meta)
    expect((await repository.findOne(message.id))!.userProperties).to.equal(
      JSON.stringify(message.properties!.userProperties),
    )
  })

  it('does not SELECT during pushMsgsToConnection', async () => {
    await service.pushMsgsToConnection(
      Array.from({ length: 120 }, (_, index) => makeMessage(index)),
      CONNECTION_ID,
    )
    expect(queries.some((query) => /^INSERT\b/i.test(query.trim()))).to.equal(true)
    expect(queries.filter((query) => /^SELECT\b/i.test(query.trim()))).to.deep.equal([])
  })

  it('rolls back earlier chunks when a later chunk has a duplicate id', async () => {
    const messages = Array.from({ length: 120 }, (_, index) => makeMessage(index))
    messages.push(makeMessage(0))
    let failure: unknown
    try {
      await service.pushMsgsToConnection(messages, CONNECTION_ID)
    } catch (error) {
      failure = error
    }
    expect(failure).to.be.instanceOf(Error)
    expect((failure as Error).message).to.include('SQLITE_CONSTRAINT')
    expect(queries.filter((query) => /^INSERT\b/i.test(query.trim())).length).to.be.greaterThan(1)
    expect(await repository.count()).to.equal(0)
  })
})
