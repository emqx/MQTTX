import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, EntitySchema, Repository } from 'typeorm'
import MessageService from '@/database/services/MessageService'
import MessageEntity from '@/database/models/MessageEntity'
import ConnectionEntity from '@/database/models/ConnectionEntity'

// Exercise the real service and SQLite query builder without connection lifecycle dependencies.
const history = new EntitySchema<MessageEntity>({
  name: 'PaginationHistory',
  columns: {
    id: { type: String, primary: true },
    connectionId: { type: String },
    topic: { type: String },
    payload: { type: String },
    createAt: { type: String },
    out: { type: Boolean },
  },
})

describe('MessageService history pagination (SQLite)', () => {
  let database: Connection
  let repository: Repository<MessageEntity>
  let service: MessageService

  const timestamp = (position: number) => new Date(Date.UTC(2026, 0, 1) + position).toISOString()
  const ids = (positions: number[]) => positions.map((position) => `message-${position}`)
  const messageIds = (messages: MessageModel[]) => messages.map((message) => message.id)
  const makeMessage = (position: number, overrides: Partial<MessageEntity> = {}) => ({
    id: `message-${position}`,
    connectionId: 'connection',
    topic: 'history/sensor',
    payload: 'needle reading',
    createAt: timestamp(position),
    out: false,
    ...overrides,
  })
  const seed = async (positions: number[]) => {
    // Insert out of chronological order so assertions also check the database ordering.
    await repository.save(
      positions
        .slice()
        .reverse()
        .map((position) => makeMessage(position)),
    )
  }

  before(async () => {
    database = await createConnection({
      name: 'message-pagination-test',
      type: 'sqlite',
      database: ':memory:',
      entities: [history],
      synchronize: true,
    })
    repository = database.getRepository(history)
    service = new MessageService(repository, {} as Repository<ConnectionEntity>)
  })

  beforeEach(async () => {
    await repository.clear()
  })

  after(async () => {
    if (database) await database.close()
  })

  const cases = [
    { name: 'no messages', positions: [], before: [], after: [], more: false },
    {
      name: 'less than one page',
      positions: [10001, 20001],
      before: [10001, 20001],
      after: [10001, 20001],
      more: false,
    },
    {
      name: 'exactly one page',
      positions: [10001, 20001, 30001],
      before: [10001, 20001, 30001],
      after: [10001, 20001, 30001],
      more: false,
    },
    {
      name: 'more than one page',
      positions: [10001, 20001, 30001, 40001],
      before: [20001, 30001, 40001],
      after: [10001, 20001, 30001],
      more: true,
    },
  ]

  for (const mode of ['before', 'after'] as const) {
    for (const testCase of cases) {
      it(`returns the nearest ${mode} messages in ascending order with ${testCase.name}`, async () => {
        await seed(testCase.positions)
        const result = await service.loadMore('connection', timestamp(mode === 'before' ? 50000 : 0), mode, {
          limit: 3,
        })
        expect(messageIds(result.list)).to.deep.equal(ids(testCase[mode]))
        expect(result.moreMsg).to.equal(testCase.more ? mode : false)
      })
    }

    for (const limit of [1, 2]) {
      it(`excludes the cursor and the opposite side when loading ${mode} with limit ${limit}`, async () => {
        await seed([10000, 20000, 30000, 40000, 50000])
        const result = await service.loadMore('connection', timestamp(30000), mode, { limit })
        const expected =
          mode === 'before' ? (limit === 1 ? [20000] : [10000, 20000]) : limit === 1 ? [40000] : [40000, 50000]
        expect(messageIds(result.list)).to.deep.equal(ids(expected))
        expect(result.moreMsg).to.equal(limit === 1 ? mode : false)
      })
    }

    it(`returns an empty page at the ${mode} end of history`, async () => {
      await seed([10001, 20001, 30001])
      const result = await service.loadMore('connection', timestamp(mode === 'before' ? 10001 : 30001), mode)
      expect(result.list).to.deep.equal([])
      expect(result.moreMsg).to.equal(false)
    })

    it(`uses the default page size when loading ${mode}`, async () => {
      await seed(Array.from({ length: 21 }, (_, index) => index + 1))
      const result = await service.loadMore('connection', timestamp(mode === 'before' ? 22 : 0), mode)
      const expected = Array.from({ length: 20 }, (_, index) => index + (mode === 'before' ? 2 : 1))
      expect(messageIds(result.list)).to.deep.equal(ids(expected))
      expect(result.moreMsg).to.equal(mode)
    })

    it(`walks consecutive ${mode} pages without missing or repeating messages`, async () => {
      const positions = [10001, 20001, 30001, 40001, 50001, 60001, 70001, 80001, 90001, 100001]
      await seed(positions)
      const collected: MessageModel[] = []
      let cursor = timestamp(mode === 'before' ? 110000 : 0)
      for (let page = 0; page < 4; page++) {
        const result = await service.loadMore('connection', cursor, mode, { limit: 3 })
        expect(result.list).to.have.lengthOf(page === 3 ? 1 : 3)
        expect(result.moreMsg).to.equal(page === 3 ? false : mode)
        if (mode === 'before') {
          collected.unshift(...result.list)
          cursor = result.list[0].createAt
        } else {
          collected.push(...result.list)
          cursor = result.list[result.list.length - 1].createAt
        }
      }
      expect(messageIds(collected)).to.deep.equal(ids(positions))
      const end = await service.loadMore('connection', cursor, mode, { limit: 3 })
      expect(end.list).to.deep.equal([])
      expect(end.moreMsg).to.equal(false)
    })

    const filterCases = [
      {
        name: 'subscription, payload search, and message type',
        options: { topic: 'history/#', searchParams: { payload: 'needle' }, msgType: 'received' as MessageType },
        excludedTopic: 'other/sensor',
      },
      {
        name: 'topic search, payload search, and message type',
        options: { searchParams: { topic: 'sensor', payload: 'needle' }, msgType: 'received' as MessageType },
        excludedTopic: 'history/humidity',
      },
    ]

    for (const filterCase of filterCases) {
      it(`paginates sparse ${mode} matches with ${filterCase.name}`, async () => {
        await seed([10001, 20001, 30001, 40001])
        await repository.save([
          makeMessage(45001, { connectionId: 'other-connection' }),
          makeMessage(35001, { topic: filterCase.excludedTopic }),
          makeMessage(25001, { payload: 'unmatched reading' }),
          makeMessage(15001, { out: true }),
          makeMessage(0),
          makeMessage(50000),
        ])
        const cursor = timestamp(mode === 'before' ? 50000 : 0)
        const first = await service.loadMore('connection', cursor, mode, { ...filterCase.options, limit: 3 })
        expect(messageIds(first.list)).to.deep.equal(
          ids(mode === 'before' ? [20001, 30001, 40001] : [10001, 20001, 30001]),
        )
        expect(first.moreMsg).to.equal(mode)
        const nextCursor = first.list[mode === 'before' ? 0 : first.list.length - 1].createAt
        const second = await service.loadMore('connection', nextCursor, mode, { ...filterCase.options, limit: 3 })
        expect(messageIds(second.list)).to.deep.equal(ids(mode === 'before' ? [0, 10001] : [40001, 50000]))
        expect(second.moreMsg).to.equal(false)
      })
    }
  }

  it('defaults to before pagination', async () => {
    await seed([10001, 20001, 30001, 40001])
    const result = await service.loadMore('connection', timestamp(50000), undefined, { limit: 3 })
    expect(messageIds(result.list)).to.deep.equal(ids([20001, 30001, 40001]))
    expect(result.moreMsg).to.equal('before')
  })

  it('prepends older pages to the initial get page without gaps or duplicates', async () => {
    await seed([10001, 20001, 30001, 40001, 50001, 60001, 70001])
    const initial = await service.get('connection', { limit: 3 })
    expect(messageIds(initial.list)).to.deep.equal(ids([50001, 60001, 70001]))
    const older = await service.loadMore('connection', initial.list[0].createAt, 'before', { limit: 3 })
    expect(messageIds(older.list)).to.deep.equal(ids([20001, 30001, 40001]))
    expect(older.moreMsg).to.equal('before')
    const oldest = await service.loadMore('connection', older.list[0].createAt, 'before', { limit: 3 })
    expect(messageIds(oldest.list)).to.deep.equal(ids([10001]))
    expect(oldest.moreMsg).to.equal(false)
    expect(messageIds([...oldest.list, ...older.list, ...initial.list])).to.deep.equal(
      ids([10001, 20001, 30001, 40001, 50001, 60001, 70001]),
    )
  })
})
