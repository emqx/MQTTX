import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, EntitySchema, Repository } from 'typeorm'
import MessageService from '@/database/services/MessageService'
import MessageEntity from '@/database/models/MessageEntity'

// A minimal history table keeps this integration test independent of connection lifecycle services.
const history = new EntitySchema<MessageEntity>({
  name: 'SearchHistory',
  columns: {
    id: { type: String, primary: true },
    connectionId: { type: String },
    topic: { type: String },
    payload: { type: String },
    createAt: { type: String },
    out: { type: Boolean },
  },
})

describe('MessageService subscription and search intersection', () => {
  let database: Connection
  let repository: Repository<MessageEntity>
  let service: MessageService

  before(async () => {
    database = await createConnection({
      name: 'message-search-test',
      type: 'sqlite',
      database: ':memory:',
      entities: [history],
      synchronize: true,
    })
    repository = database.getRepository(history)
    service = new MessageService(repository, {} as any)
    await repository.save(
      ['a/temp', 'b/temp', 'a/humidity', 'a/temp/older', 'b/temp/older', 'a/temp/newer'].map((topic, i) => ({
        id: String(i),
        connectionId: 'connection',
        topic,
        payload: 'reading',
        createAt: `2026-01-01 00:00:0${i}`,
        out: false,
      })),
    )
  })

  after(async () => {
    if (database) await database.close()
  })

  it('get keeps topic search inside the selected subscription before pagination', async () => {
    const result = await service.get('connection', {
      topic: 'a/#',
      searchParams: { topic: 'temp' },
      limit: 2,
      preserveOrder: true,
    })
    expect(result.list.map((message) => message.topic)).to.deep.equal(['a/temp/newer', 'a/temp/older'])
  })

  it('loadMore before keeps search inside the selected subscription', async () => {
    const result = await service.loadMore('connection', '2026-01-01 00:00:05', 'before', {
      topic: 'a/#',
      searchParams: { topic: 'temp' },
      limit: 10,
    })
    expect(result.list.map((message) => message.topic)).to.deep.equal(['a/temp', 'a/temp/older'])
  })

  it('loadMore after keeps search inside the selected subscription', async () => {
    const result = await service.loadMore('connection', '2026-01-01 00:00:00', 'after', {
      topic: 'a/#',
      searchParams: { topic: 'temp' },
      limit: 10,
    })
    expect(result.list.map((message) => message.topic)).to.deep.equal(['a/temp/older', 'a/temp/newer'])
  })

  it('still permits a topic search without a subscription filter', async () => {
    const result = await service.get('connection', { searchParams: { topic: 'temp' }, limit: 10 })
    expect(result.list.map((message) => message.topic)).to.include('b/temp')
  })
})
