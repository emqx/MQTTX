import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, EntitySchema, Repository } from 'typeorm'
import MessageService from '@/database/services/MessageService'
import MessageEntity from '@/database/models/MessageEntity'

const history = new EntitySchema<MessageEntity>({
  name: 'TopicHistory',
  columns: {
    id: { type: String, primary: true },
    connectionId: { type: String },
    topic: { type: String },
    payload: { type: String },
    createAt: { type: String },
    out: { type: Boolean },
  },
})

describe('MessageService MQTT topic query (SQLite)', () => {
  let database: Connection
  let repository: Repository<MessageEntity>
  let service: MessageService
  const topics = [
    'a',
    'a/',
    'a/b',
    'a/b/c',
    'a/b/c/d',
    'a/b/d',
    'a//d',
    'a//',
    'a/b/',
    'A/b/d',
    'a/percent%_/d',
    'a/percentXY/d',
    'literal%_/x',
    'literalXY/x',
    '$SYS/broker/uptime',
    '$shareable/topic',
    '/',
    '/b',
    'a\\b/c',
  ]

  before(async () => {
    database = await createConnection({
      name: 'message-topic-test',
      type: 'sqlite',
      database: ':memory:',
      entities: [history],
      synchronize: true,
    })
    repository = database.getRepository(history)
    service = new MessageService(repository, {} as any)
    await repository.save(
      topics.map((topic, i) => ({
        id: String(i),
        connectionId: 'connection',
        topic,
        payload: 'reading',
        createAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
        out: false,
      })),
    )
  })
  after(async () => {
    if (database) await database.close()
  })

  const cases: Array<[string, string[]]> = [
    ['a/+/d', ['a/b/d', 'a//d', 'a/percent%_/d', 'a/percentXY/d']],
    ['a/+/+', ['a/b/c', 'a/b/d', 'a//d', 'a//', 'a/b/', 'a/percent%_/d', 'a/percentXY/d']],
    ['a/#', topics.filter((topic) => topic === 'a' || topic.startsWith('a/'))],
    ['a/+/#', topics.filter((topic) => topic.startsWith('a/'))],
    ['a/+', ['a/', 'a/b']],
    ['a/b', ['a/b']],
    ['literal%_/#', ['literal%_/x']],
    ['a/percent%_/+', ['a/percent%_/d']],
    ['a\\b/+', ['a\\b/c']],
    ['$share/group/a/+/d', ['a/b/d', 'a//d', 'a/percent%_/d', 'a/percentXY/d']],
    ['$share/group/#', topics.filter((topic) => !topic.startsWith('$'))],
    ['$SYS/#', ['$SYS/broker/uptime']],
    ['+/broker/+', []],
    ['#', topics.filter((topic) => !topic.startsWith('$'))],
    ['', topics],
    ['+/+', ['a/', 'a/b', 'literal%_/x', 'literalXY/x', '/', '/b', 'a\\b/c']],
  ]
  for (const [filter, expected] of cases) {
    it(`matches ${JSON.stringify(filter)} exactly, including empty levels and literal SQL characters`, async () => {
      const result = await service.get('connection', { topic: filter, limit: 100 })
      expect(result.list.map((message) => message.topic)).to.deep.equal(expected)
    })
  }

  it('filters sparse hits before page boundaries', async () => {
    const result = await service.get('connection', { topic: 'a/+/d', limit: 2, page: 2, preserveOrder: true })
    expect(result.list.map((message) => message.topic)).to.deep.equal(['a//d', 'a/b/d'])
  })

  for (const mode of ['before', 'after'] as const) {
    it(`applies exact matching in loadMore ${mode}`, async () => {
      const boundary = mode === 'before' ? '2027' : '2025'
      const result = await service.loadMore('connection', boundary, mode, { topic: 'a/+/d', limit: 10 })
      expect(result.list.map((message) => message.topic)).to.deep.equal([
        'a/b/d',
        'a//d',
        'a/percent%_/d',
        'a/percentXY/d',
      ])
    })
  }

  it('matches a near-maximum MQTT topic without treating SQL metacharacters as wildcards', async () => {
    const topic = 'a/' + 'x'.repeat(65520) + '%_/d'
    await repository.save({
      id: 'long-name',
      connectionId: 'long-name',
      topic,
      payload: '',
      createAt: '2026',
      out: false,
    })
    const result = await service.get('long-name', { topic: 'a/+/d' })
    expect(result.list.map((message) => message.topic)).to.deep.equal([topic])
  })

  it('supports many wildcard levels and a long literal topic', async () => {
    const topic = Array(1100).fill('level').join('/')
    await repository.save({ id: 'long', connectionId: 'long', topic, payload: '', createAt: '2026', out: false })
    const result = await service.get('long', { topic: Array(1100).fill('+').join('/') })
    expect(result.list.map((message) => message.topic)).to.deep.equal([topic])
    const literal = await service.get('long', { topic })
    expect(literal.list).to.have.lengthOf(1)
  })
})
