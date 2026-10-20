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
    const messageService = new MessageService(messageRepository, connectionRepository)
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
})
