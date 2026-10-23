import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, EntitySchema, Repository } from 'typeorm'
import MessageService from '@/database/services/MessageService'
import MessageEntity from '@/database/models/MessageEntity'

// Mirrors the fixture used by messageTopicQuery.spec.ts: a real in-memory
// SQLite database so the query (ORDER BY + LIMIT) is exercised, not mocked.
const history = new EntitySchema<MessageEntity>({
  name: 'TopicHistoryWindow',
  columns: {
    id: { type: String, primary: true },
    connectionId: { type: String },
    topic: { type: String },
    payload: { type: String },
    createAt: { type: String },
    out: { type: Boolean },
  },
})

const TOTAL = 1005

describe('MessageService topic-pattern history window (SQLite)', () => {
  let database: Connection
  let repository: Repository<MessageEntity>
  let service: MessageService

  before(async () => {
    database = await createConnection({
      name: 'message-history-window-test',
      type: 'sqlite',
      database: ':memory:',
      entities: [history],
      synchronize: true,
    })
    repository = database.getRepository(history)
    service = new MessageService(repository, {} as any)

    await repository.save(
      Array.from({ length: TOTAL }, (_, i) => ({
        id: String(i + 1),
        connectionId: 'connection',
        topic: 'plant/temp',
        payload: String(i + 1),
        createAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
        out: false,
      })),
    )
  })

  after(async () => {
    if (database) await database.close()
  })

  for (const topic of ['plant/temp', 'plant/+', 'plant/#']) {
    it(`returns the newest 1000 messages for ${topic} in ascending time order`, async () => {
      const result = await service.getMessagesByTopicPattern<MessageModel>('connection', topic)

      expect(result).to.have.length(1000)
      // The oldest five (1..5) fall outside the window; the sixth is the first.
      expect(result[0].payload).to.equal('6')
      expect(result[result.length - 1].payload).to.equal(String(TOTAL))

      const timestamps = result.map((message) => message.createAt)
      expect(timestamps).to.deep.equal([...timestamps].sort())
    })
  }

  it('keeps the newest messages inside an explicit time range', async () => {
    const result = await service.getMessagesByTopicPattern<MessageModel>('connection', 'plant/+', {
      startTime: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)).toISOString(),
      endTime: new Date(Date.UTC(2026, 0, 1, 0, 10, 0)).toISOString(),
      limit: 3,
    })

    expect(result.map((message) => message.payload)).to.deep.equal(['599', '600', '601'])
  })

  it('loads Traffic Monitor history with an MQTT filter for broker metrics', async () => {
    const topics = [
      '$SYS/brokers/a/metrics/bytes/received',
      '$SYS/brokers/b/metrics/bytes/sent',
      '$SYS/brokers/b/metrics/bytes/sent/extra',
    ]
    await repository.save(
      topics.map((topic, index) => ({
        id: `traffic-${index}`,
        connectionId: 'traffic',
        topic,
        payload: '10',
        createAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
        out: false,
      })),
    )

    const result = await service.getMessagesByTopicPattern<MessageModel>('traffic', '$SYS/brokers/+/metrics/bytes/+')
    expect(result.map((message) => message.topic)).to.deep.equal(topics.slice(0, 2))
  })
})
