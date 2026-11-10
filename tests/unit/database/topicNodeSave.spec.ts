import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, Repository, TreeRepository } from 'typeorm'
import TopicNodeService from '@/database/services/TopicNodeService'
import MessageService from '@/database/services/MessageService'
import TopicNodeEntity from '@/database/models/TopicNodeEntity'
import MessageEntity from '@/database/models/MessageEntity'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import WillEntity from '@/database/models/WillEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'

const entities = [ConnectionEntity, CollectionEntity, WillEntity, MessageEntity, SubscriptionEntity, TopicNodeEntity]

const CONNECTION_ID = 'conn1'

const makeSnapshot = (count: number, payload: string): TopicTreeNode[] => [
  { id: CONNECTION_ID, label: 'broker', messageCount: count, subTopicCount: 3, children: [] },
  {
    id: `${CONNECTION_ID}_0`,
    label: 'uns',
    messageCount: count,
    subTopicCount: 2,
    parentId: CONNECTION_ID,
    children: [],
  },
  {
    id: `${CONNECTION_ID}_0_0`,
    label: 'site1',
    messageCount: count,
    subTopicCount: 1,
    parentId: `${CONNECTION_ID}_0`,
    children: [],
  },
  {
    id: `${CONNECTION_ID}_0_0_0`,
    label: 'line1',
    messageCount: count,
    subTopicCount: 0,
    parentId: `${CONNECTION_ID}_0_0`,
    children: [],
    message: {
      createAt: `2026-01-01T00:00:0${count}.000Z`,
      out: false,
      payload,
      qos: 0,
      retain: false,
      topic: 'uns/site1/line1',
    },
  },
]

describe('TopicNodeService batch save (SQLite)', () => {
  let database: Connection
  let messageService: MessageService
  let service: TopicNodeService
  let topicNodeRepository: TreeRepository<TopicNodeEntity>
  let messageRepository: Repository<MessageEntity>

  beforeEach(async () => {
    database = await createConnection({
      name: 'topic-node-save',
      type: 'sqlite',
      database: ':memory:',
      entities,
      synchronize: true,
    })
    topicNodeRepository = database.getTreeRepository(TopicNodeEntity)
    messageRepository = database.getRepository(MessageEntity)
    const connectionRepository = database.getRepository(ConnectionEntity)
    messageService = new MessageService(messageRepository, connectionRepository)
    service = new TopicNodeService(topicNodeRepository, connectionRepository, messageService)

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
  })

  afterEach(async () => {
    if (database?.isConnected) await database.close()
  })

  it('keeps one row per node with the last snapshot and stores every message', async () => {
    const first = makeSnapshot(1, 'first')
    const second = makeSnapshot(2, 'second')
    const third = makeSnapshot(3, 'third')

    const result = await service.saveTopicNodesWithMessages([...first, ...second, ...third])

    expect(result).to.deep.equal({ savedEntitiesCount: 4, savedMessagesCount: 3 })
    expect(await topicNodeRepository.count()).to.equal(4)
    expect(await messageRepository.count()).to.equal(3)

    const uns = await topicNodeRepository.findOne(`${CONNECTION_ID}_0`)
    expect(uns!.messageCount).to.equal(3)

    const leaf = await topicNodeRepository.findOne(`${CONNECTION_ID}_0_0_0`, { relations: ['message', 'parent'] })
    expect(leaf).to.exist
    expect(leaf!.messageCount).to.equal(3)
    expect(leaf!.subTopicCount).to.equal(0)
    expect(leaf!.message!.payload).to.equal('third')
    expect(leaf!.parent!.id).to.equal(`${CONNECTION_ID}_0_0`)

    const payloads = (await messageRepository.find()).map((message) => message.payload).sort()
    expect(payloads).to.deep.equal(['first', 'second', 'third'])
  })

  describe('MessageService inserts', () => {
    const message = (id?: string): MessageModel => ({
      id,
      createAt: '2026-01-01 00:00:00',
      out: false,
      payload: 'reading',
      qos: 1,
      retain: false,
      topic: 'sensor/readings',
      meta: JSON.stringify({ batch: { carrier: 'property', logicalTopic: 'sensor/readings', count: 1 } }),
      properties: {
        payloadFormatIndicator: false,
        messageExpiryInterval: 10,
        topicAlias: 1,
        responseTopic: 'reply',
        correlationData: 'correlation',
        userProperties: { key: ['one', 'two'] },
        subscriptionIdentifier: 1,
        contentType: 'text/plain',
      },
    })

    it('returns an entity array with a generated id for a new message', async () => {
      const result = (await messageService.pushMsgsToConnection(message(), CONNECTION_ID)) as MessageEntity[]
      expect(result).to.have.length(1)
      expect(result[0].id).to.be.a('string').and.not.equal('')
      expect(await messageRepository.findOne(result[0].id)).to.include({
        payload: 'reading',
        connectionId: CONNECTION_ID,
      })
    })

    it('preserves MQTT properties and batch metadata', async () => {
      const input = message('properties')
      const result = (await messageService.pushMsgsToConnection(input, CONNECTION_ID)) as MessageEntity[]
      const stored = await messageRepository.findOneOrFail('properties')
      expect(stored).to.include({
        meta: input.meta,
        correlationData: 'correlation',
        userProperties: '{"key":["one","two"]}',
        contentType: 'text/plain',
      })
      expect(result[0]).to.include({ meta: stored.meta, userProperties: stored.userProperties })
    })

    it('inserts a large batch in input order within the portable SQLite parameter limit', async () => {
      const messages = Array.from({ length: 130 }, (_, index) => message(`chunk-${index}`))
      const runner = database.createQueryRunner()
      const query = runner.query
      let maxParameters = 0
      let inserts = 0
      runner.query = function (sql: string, parameters?: any[]) {
        maxParameters = Math.max(maxParameters, parameters?.length || 0)
        if (sql.startsWith('INSERT')) inserts++
        return query.call(this, sql, parameters)
      }
      try {
        const result = (await messageService.pushMsgsToConnection(messages, CONNECTION_ID)) as MessageEntity[]
        expect(result.map(({ id }) => id)).to.deep.equal(messages.map(({ id }) => id))
        expect(
          (await database.query('SELECT id FROM MessageEntity ORDER BY rowid')).map((row: MessageEntity) => row.id),
        ).to.deep.equal(messages.map(({ id }) => id))
        expect(maxParameters).to.be.at.most(999)
        expect(inserts).to.be.lessThan(messages.length)
      } finally {
        runner.query = query
      }
    })

    it('rolls back earlier chunks when a later insert fails', async () => {
      const messages = Array.from({ length: 130 }, (_, index) => message(`rollback-${index}`))
      messages[129].payload = undefined as any
      let failed = false
      try {
        await messageService.pushMsgsToConnection(messages, CONNECTION_ID)
      } catch {
        failed = true
      }
      expect(failed).to.equal(true)
      expect(await messageRepository.count()).to.equal(0)
    })

    it('joins the caller transaction without starting another SQLite transaction', async () => {
      await database.transaction(async (manager) => {
        const service = new MessageService(
          manager.getRepository(MessageEntity),
          manager.getRepository(ConnectionEntity),
        )
        await service.pushMsgsToConnection(message('outer-transaction'), CONNECTION_ID)
      })
      expect(await messageRepository.count()).to.equal(1)
    })

    it('keeps import upserts for existing message ids', async () => {
      await messageService.pushMsgsToConnection(message('imported'), CONNECTION_ID)
      await messageService.importMsgsToConnection({ ...message('imported'), payload: 'updated' }, CONNECTION_ID)
      expect(await messageRepository.count()).to.equal(1)
      expect((await messageRepository.findOneOrFail('imported')).payload).to.equal('updated')
    })
  })
})
