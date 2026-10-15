import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Connection, createConnection, MigrationInterface, Repository } from 'typeorm'
import ConnectionService from '@/database/services/ConnectionService'
import CollectionService from '@/database/services/CollectionService'
import HistoryMessagePayloadService from '@/database/services/HistoryMessagePayloaderService'
import HistoryMessageHeaderService from '@/database/services/HistoryMessageHeaderService'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import HistoryMessagePayloadEntity from '@/database/models/HistoryMessagePayloadEntity'
import HistoryMessageHeaderEntity from '@/database/models/HistoryMessageHeaderEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import { getDefaultRecord } from '@/utils/mqttUtils'

const entities = [
  ConnectionEntity,
  CollectionEntity,
  HistoryConnectionEntity,
  HistoryMessagePayloadEntity,
  HistoryMessageHeaderEntity,
  WillEntity,
  MessageEntity,
  SubscriptionEntity,
]

describe('Per-connection publish area and history', () => {
  let database: Connection
  let connectionService: ConnectionService
  let collectionService: CollectionService
  let payloadService: HistoryMessagePayloadService
  let headerService: HistoryMessageHeaderService
  let payloadRepository: Repository<HistoryMessagePayloadEntity>
  let collectionRepository: Repository<CollectionEntity>

  beforeEach(async () => {
    database = await createConnection({
      name: 'publish-history',
      type: 'sqlite',
      database: ':memory:',
      entities,
      synchronize: true,
    })
    const connections = database.getRepository(ConnectionEntity)
    const wills = database.getRepository(WillEntity)
    payloadRepository = database.getRepository(HistoryMessagePayloadEntity)
    collectionRepository = database.getRepository(CollectionEntity)
    connectionService = new ConnectionService(connections, database.getRepository(HistoryConnectionEntity), wills)
    collectionService = new CollectionService(collectionRepository, connections, wills)
    payloadService = new HistoryMessagePayloadService(payloadRepository)
    headerService = new HistoryMessageHeaderService(database.getRepository(HistoryMessageHeaderEntity))
  })

  afterEach(async () => {
    if (database?.isConnected) await database.close()
  })

  const createConnectionWithHistory = async (name: string, parentId: string | null = null) => {
    const { id } = (await connectionService.create({ ...getDefaultRecord(), name, parentId }))!
    await payloadService.create({ connectionId: id, payload: name, payloadType: 'Plaintext' })
    await headerService.create({ connectionId: id, topic: name, qos: 0, retain: false })
    return id!
  }

  it('keeps the latest ten history entries of each connection', async () => {
    const a = await createConnectionWithHistory('a')
    const b = await createConnectionWithHistory('b')
    // Older entries fill the connection up to the limit, together with the one created above.
    for (let i = 1; i <= 9; i++) {
      await payloadRepository.save({
        connectionId: a,
        payload: `a${i}`,
        payloadType: 'Plaintext',
        createAt: `2000-01-01 00:00:0${i}`,
      })
    }
    await payloadService.create({ connectionId: a, payload: 'latest', payloadType: 'Plaintext' })
    const payloads = (await payloadService.getAll(a))!.map(({ payload }) => payload)
    expect(payloads).to.have.length(10)
    expect(payloads).not.to.include('a1')
    expect(payloads).to.include('latest')
    expect((await payloadService.getAll(b))!.map(({ payload }) => payload)).to.deep.equal(['b'])
  })

  it('stores the publish area content on its connection', async () => {
    const id = await createConnectionWithHistory('a')
    expect(await connectionService.getPushMessage(id)).to.equal(undefined)
    const message: PushMessageModel = { topic: 't', qos: 1, retain: true, payload: '', payloadType: 'Hex' }
    await connectionService.updatePushMessage(id, message)
    expect(await connectionService.getPushMessage(id)).to.deep.equal(message)
    const [listed] = await connectionService.getAll()
    expect(listed).not.to.have.property('pushMessage')
  })

  it('deletes history with its connection or group', async () => {
    const group = await collectionRepository.save({ name: 'Group' })
    const subgroup = await collectionRepository.save({ name: 'Subgroup', parent: group })
    const deleted = await createConnectionWithHistory('deleted')
    const inSubgroup = await createConnectionWithHistory('subgroup', subgroup.id)
    const kept = await createConnectionWithHistory('kept')
    await connectionService.delete(deleted)
    await collectionService.delete(group.id!)
    const remaining = await payloadRepository.find()
    expect(remaining.map(({ connectionId }) => connectionId)).to.deep.equal([kept])
    expect(await headerService.getAll(inSubgroup)).to.deep.equal([])
  })
})

type MigrationClass = new () => MigrationInterface

describe('Upgrading shared publish history', () => {
  const context = require.context('@/database/migration', false, /\.ts$/)
  const migrations = context.keys().flatMap((key) => Object.values(context(key)) as MigrationClass[])
  const upgrade = migrations.find(({ name }) => name.startsWith('connectionPublishHistory'))!
  let directory: string

  const open = (withUpgrade: boolean) =>
    createConnection({
      name: `upgrade-${withUpgrade}`,
      type: 'sqlite',
      database: path.join(directory, 'MQTTX.db'),
      migrations: withUpgrade ? migrations : migrations.filter((migration) => migration !== upgrade),
      migrationsTableName: 'temp_migration_table',
    })

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-history-upgrade-'))
  })

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true })
  })

  it('copies shared history to every connection without touching other connection data', async () => {
    const before = await open(false)
    await before.runMigrations()
    for (const id of ['a', 'b']) {
      await before.query(`INSERT INTO WillEntity (id) VALUES ('will-${id}')`)
      await before.query(
        `INSERT INTO ConnectionEntity (id, client_id, name, host, port, connectTimeout, reconnect, ssl, mqttVersion,
          unreadMessageCount, ca, cert, key, willId) VALUES ('${id}', '${id}', '${id}', 'localhost', 1883, 10, 0, 0,
          '5.0', 0, '', '', '', 'will-${id}')`,
      )
      await before.query(`INSERT INTO SubscriptionEntity (id, topic, connection_id) VALUES ('sub-${id}', '#', '${id}')`)
    }
    await before.query(
      `INSERT INTO historyMessagePayloadEntity (id, payload, payloadType) VALUES ('p', 'shared', 'Hex')`,
    )
    await before.query(`INSERT INTO historyMessageHeaderEntity (id, retain, topic, qos) VALUES ('h', 1, 'shared', 2)`)
    await before.close()

    const after = await open(true)
    await after.runMigrations()
    const payloads = await after.query(`SELECT connection_id, payload, payloadType FROM historyMessagePayloadEntity`)
    const headers = await after.query(`SELECT connection_id, topic FROM historyMessageHeaderEntity`)
    const subscriptions = await after.query(`SELECT id FROM SubscriptionEntity`)
    await after.close()
    expect(payloads).to.have.deep.members([
      { connection_id: 'a', payload: 'shared', payloadType: 'Hex' },
      { connection_id: 'b', payload: 'shared', payloadType: 'Hex' },
    ])
    expect(headers).to.have.deep.members([
      { connection_id: 'a', topic: 'shared' },
      { connection_id: 'b', topic: 'shared' },
    ])
    expect(subscriptions).to.have.length(2)
  })
})
