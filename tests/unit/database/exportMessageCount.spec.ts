import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, Repository } from 'typeorm'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageService from '@/database/services/MessageService'

describe('Export message count (SQLite)', () => {
  let database: Connection
  let messages: Repository<MessageEntity>
  let service: MessageService

  beforeEach(async () => {
    database = await createConnection({
      name: 'export-message-count',
      type: 'sqlite',
      database: ':memory:',
      entities: [ConnectionEntity, CollectionEntity, MessageEntity, SubscriptionEntity, WillEntity],
      synchronize: true,
    })
    messages = database.getRepository(MessageEntity)
    service = new MessageService(messages, database.getRepository(ConnectionEntity))
  })

  afterEach(async () => {
    if (database?.isConnected) await database.close()
  })

  const seed = async (connectionId: string, count: number) => {
    await database.getRepository(ConnectionEntity).save({
      id: connectionId,
      clientId: connectionId,
      name: connectionId,
      host: 'localhost',
      port: 1883,
      connectTimeout: 10000,
      reconnect: false,
      ssl: false,
      mqttVersion: '5.0',
      unreadMessageCount: 0,
      ca: '',
      cert: '',
      key: '',
    })
    for (let index = 0; index < count; index++) {
      await messages.save({
        connectionId,
        topic: 'test/topic',
        payload: 'payload',
        out: false,
        qos: 0,
        retain: false,
        createAt: '2026-01-01 00:00:00',
      })
    }
  }

  it('counts exported connections in one query and excludes the rest', async () => {
    const ids = ['first', 'second', 'empty']
    await seed('first', 2)
    await seed('second', 3)
    await seed('empty', 0)
    await seed('excluded', 4)
    const parameters: any[][] = []
    database.logger.logQuery = (_query, values) => parameters.push(values ?? [])

    expect(await service.countByConnectionIds(ids)).to.equal(5)
    expect(parameters).to.have.lengthOf(1)
    expect(parameters[0]).to.have.members(ids)
  })

  it('returns zero for an empty list without querying', async () => {
    await seed('excluded', 1)
    const queries: string[] = []
    database.logger.logQuery = (query) => queries.push(query)

    expect(await service.countByConnectionIds([])).to.equal(0)
    expect(queries).to.deep.equal([])
  })

  it('sums counts across the 999-parameter boundary without counting other connections', async () => {
    const ids = Array.from({ length: 1001 }, (_, index) => `connection-${index}`)
    await seed(ids[0], 1)
    await seed(ids[998], 2)
    await seed(ids[999], 3)
    await seed(ids[1000], 4)
    await seed('excluded', 5)
    const parameters: any[][] = []
    database.logger.logQuery = (_query, values) => parameters.push(values ?? [])

    expect(await service.countByConnectionIds(ids)).to.equal(10)
    expect(parameters.length).to.be.greaterThan(1)
    expect(parameters.flat()).to.have.members(ids)
  })
})
