import { expect } from 'chai'
import { Container } from 'typedi'
import { createConnection } from 'typeorm'
import HistoryMessageHeaderService from '@/database/services/HistoryMessageHeaderService'
import { hasMessageHeaderID } from '@/utils/historyRecordUtils'
import { batchPublishing1794300000000 } from '@/database/migration/1794300000000-batchPublishing'

it('deduplicates ordinary and batch headers separately within the current connection', async () => {
  const originalGet = Container.get
  const header = { topic: 'demo', qos: 1 as const, retain: false, connectionId: 'c1' }
  ;(Container as any).get = (type: unknown) =>
    type === HistoryMessageHeaderService
      ? {
          getAll: async (id: string) =>
            id === 'c1'
              ? [
                  { ...header, id: 'ordinary' },
                  { ...header, batch: true, id: 'batch' },
                ]
              : [],
        }
      : {}
  try {
    expect(await hasMessageHeaderID({ ...header, batch: false })).to.equal('ordinary')
    expect(await hasMessageHeaderID({ ...header, batch: true })).to.equal('batch')
    expect(await hasMessageHeaderID({ ...header, connectionId: 'other', batch: true })).to.equal(null)
  } finally {
    Container.get = originalGet
  }
})

it('migrates batch history up and down without removing existing headers', async () => {
  const db = await createConnection({ name: 'batch-history-migration', type: 'sqlite', database: ':memory:' })
  const runner = db.createQueryRunner()
  const migration = new batchPublishing1794300000000()
  try {
    await db.query(
      'CREATE TABLE historyMessageHeaderEntity (id varchar PRIMARY KEY, topic varchar, qos integer, retain boolean)',
    )
    await db.query("INSERT INTO historyMessageHeaderEntity VALUES ('h', 'demo', 1, 0)")
    await migration.up(runner)
    expect(await db.query('SELECT * FROM historyMessageHeaderEntity')).to.deep.equal([
      { id: 'h', topic: 'demo', qos: 1, retain: 0, batch: 0 },
    ])
    await db.query('UPDATE historyMessageHeaderEntity SET batch = 1')
    await migration.down(runner)
    expect(await db.query('SELECT * FROM historyMessageHeaderEntity')).to.deep.equal([
      { id: 'h', topic: 'demo', qos: 1, retain: 0 },
    ])
  } finally {
    await runner.release()
    await db.close()
  }
})
