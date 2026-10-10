import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection } from 'typeorm'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import WillEntity from '@/database/models/WillEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import ConnectionService from '@/database/services/ConnectionService'
import CollectionService from '@/database/services/CollectionService'
import MessageService from '@/database/services/MessageService'
import { StreamDataExporter } from '@/main/streamExportData'
import { Container } from 'typedi'
import { CollectionBackup } from '@/utils/connectionBackup'
import YAML from 'js-yaml'
import Excel from 'xlsx'

const connection = (id: string, parentId: string | null = null): ConnectionModel => ({
  id,
  name: id,
  clientId: id,
  host: 'localhost',
  port: 1883,
  protocol: 'mqtt',
  clean: true,
  keepalive: 60,
  connectTimeout: 10000,
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
  createAt: '2026-01-01 00:00:00',
  updateAt: '2026-01-01 00:00:00',
  parentId,
  orderId: 1,
  messages: [],
  subscriptions: [],
})
const collection = (id: string, parentId: string | null = null, orderId = 0): CollectionBackup => ({
  id,
  name: id,
  isCollection: true,
  parentId,
  orderId,
})
const message = (id: string): MessageModel => ({
  id,
  topic: 'test/topic',
  payload: 'payload',
  out: false,
  qos: 1,
  retain: false,
  createAt: '2026-01-01 00:00:00',
  properties: { contentType: 'text/plain', userProperties: { source: 'backup' } },
})

describe('Desktop connection backup (native SQLite)', () => {
  let directory: string
  let source: Connection
  let target: Connection
  let targetService: ConnectionService
  let output: string
  let events: Array<[string, ...any[]]>
  const originalSaveDialog = dialog.showSaveDialog
  const originalGet = Container.get
  // Services backed by the current test database, resolved through useServices().
  const services: any = {}

  const configureServices = (database: Connection) => {
    const connections = database.getRepository(ConnectionEntity)
    const wills = database.getRepository(WillEntity)
    const service = new ConnectionService(connections, database.getRepository(HistoryConnectionEntity), wills)
    Object.assign(services, {
      connectionService: service,
      collectionService: new CollectionService(database.getRepository(CollectionEntity), connections, wills),
      messageService: new MessageService(database.getRepository(MessageEntity), connections),
    })
    return service
  }

  beforeEach(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-backup-test-'))
    const open = (name: string) =>
      createConnection({
        name,
        type: 'sqlite',
        database: path.join(directory, `${name}.db`),
        entities: [
          ConnectionEntity,
          CollectionEntity,
          MessageEntity,
          SubscriptionEntity,
          WillEntity,
          HistoryConnectionEntity,
        ],
        synchronize: true,
      })
    source = await open('backup-source')
    target = await open('backup-target')
    targetService = configureServices(target)
    const byType = new Map<unknown, string>([
      [ConnectionService, 'connectionService'],
      [CollectionService, 'collectionService'],
      [MessageService, 'messageService'],
    ])
    ;(Container as any).get = (type: unknown) => services[byType.get(type) ?? ''] ?? {}
    output = path.join(directory, 'backup.json')
    events = []
    dialog.showSaveDialog = (async () => ({ canceled: false, filePath: output })) as any
  })

  afterEach(async () => {
    dialog.showSaveDialog = originalSaveDialog
    Container.get = originalGet
    if (source?.isConnected) await source.close()
    if (target?.isConnected) await target.close()
    fs.rmSync(directory, { recursive: true, force: true })
    Object.keys(services).forEach((key) => delete services[key])
  })

  const seed = async (database: Connection, model: ConnectionModel) => {
    const will = await database.getRepository(WillEntity).save({})
    await database.getRepository(ConnectionEntity).save({ ...ConnectionService.modelToEntity(model), will })
  }

  const exportBackup = async (format: 'JSON' | 'YAML' | 'XML' | 'CSV' | 'Excel' = 'JSON', connectionId?: string) => {
    output = path.join(directory, `backup.${format === 'Excel' ? 'xlsx' : format.toLowerCase()}`)
    configureServices(source)
    const win = { webContents: { send: (...event: any[]) => events.push(event as any) } } as unknown as BrowserWindow
    await new StreamDataExporter(win).export({ filename: 'backup', format, connectionId })
    expect(events, 'export should complete without an error').to.deep.equal([['saved']])
    return fs.readFileSync(output, 'utf8')
  }

  it('round trips the issue #1255 case: two groups with one connection each', async () => {
    for (const id of ['Group1', 'Group2']) {
      await source.getRepository(CollectionEntity).save({ id, name: id, orderId: 0 })
      await seed(source, connection(`${id}Connection1`, id))
    }
    const backup = JSON.parse(await exportBackup())
    configureServices(target)
    expect(await targetService.import(backup)).to.equal('ok')
    expect(await target.getRepository(CollectionEntity).count()).to.equal(2)
    expect((await target.getRepository(ConnectionEntity).find()).map((item) => item.parentId)).to.have.members([
      'Group1',
      'Group2',
    ])
  })

  it('exports a database containing only an empty group', async () => {
    await source.getRepository(CollectionEntity).save({ id: 'empty', name: 'Empty', orderId: 7 })
    const backup = JSON.parse(await exportBackup())
    expect(backup).to.deep.equal([{ id: 'empty', name: 'Empty', orderId: 7, isCollection: true, parentId: null }])
    expect(await targetService.import(backup)).to.equal('ok')
    expect(await target.getTreeRepository(CollectionEntity).findRoots()).to.have.lengthOf(1)
  })

  it('restores shuffled nested and empty groups, connection membership, and order', async () => {
    const records = [
      collection('leaf', 'nested', 3),
      connection('inside', 'leaf'),
      collection('empty', 'root', 2),
      collection('nested', 'root', 1),
      collection('root', null, 4),
      connection('outside'),
    ]
    const original = JSON.stringify(records)
    expect(await targetService.import(records)).to.equal('ok')
    expect(JSON.stringify(records), 'import must not modify the parsed backup').to.equal(original)
    const tree = await target.getTreeRepository(CollectionEntity).findTrees()
    expect(tree.map((item) => [item.id, item.orderId])).to.deep.equal([['root', 4]])
    expect(tree[0].children.map((item) => [item.id, item.orderId])).to.have.deep.members([
      ['nested', 1],
      ['empty', 2],
    ])
    expect(tree[0].children.find((item) => item.id === 'nested')!.children[0].id).to.equal('leaf')
    expect((await target.getRepository(ConnectionEntity).findOne('inside'))!.parentId).to.equal('leaf')
    expect((await target.getRepository(ConnectionEntity).findOne('outside'))!.parentId).to.be.null
    configureServices(target)
    const sidebar = await services.collectionService.getAll()
    const restoredRoot = sidebar.find((item: any) => item.id === 'root')
    expect(restoredRoot.children.find((item: any) => item.id === 'empty').children).to.deep.equal([])
    expect(restoredRoot.children.find((item: any) => item.id === 'nested').children[0].children[0].id).to.equal(
      'inside',
    )
  })

  it('exports only the selected connection and its ancestors for single-connection JSON', async () => {
    const repository = source.getRepository(CollectionEntity)
    await repository.save({ id: 'root', name: 'Root' })
    await repository.save({ id: 'nested', name: 'Nested', parent: { id: 'root' } })
    await repository.save({ id: 'unrelated', name: 'Unrelated' })
    await seed(source, connection('selected', 'nested'))
    await seed(source, connection('other', 'unrelated'))
    const backup = JSON.parse(await exportBackup('JSON', 'selected'))
    expect(backup.map((item: any) => item.id)).to.have.members(['root', 'nested', 'selected'])
    expect(await targetService.import(backup)).to.equal('ok')
    expect((await target.getRepository(ConnectionEntity).findOne('selected'))!.parentId).to.equal('nested')
    expect((await target.getTreeRepository(CollectionEntity).findTrees())[0].children[0].id).to.equal('nested')
  })

  it('imports legacy arrays at the root without mutating dangling parent IDs', async () => {
    const legacy = [connection('legacy', 'missing')]
    delete (legacy[0] as any).isCollection
    expect(await targetService.import(legacy)).to.equal('ok')
    expect((await target.getRepository(ConnectionEntity).findOne('legacy'))!.parentId).to.be.null
    expect(legacy[0].parentId).to.equal('missing')
  })

  it('creates an ID for legacy connections that omit it', async () => {
    const legacy = connection('legacy')
    delete (legacy as any).id
    expect(await targetService.import([legacy])).to.equal('ok')
    expect((await target.getRepository(ConnectionEntity).find())[0].id).to.be.a('string')
  })

  it('updates the same IDs on repeated import without duplicating children or closure rows', async () => {
    const model = connection('inside', 'nested')
    model.messages = [message('message')]
    model.subscriptions = [
      {
        id: 'sub',
        topic: 'test/#',
        qos: 1,
        disabled: false,
        createAt: '2026-01-01 00:00:00',
        userProperties: { source: 'backup' },
      },
    ]
    model.will = { id: 'will', lastWillTopic: 'will', lastWillPayload: 'offline', lastWillQos: 1, lastWillRetain: true }
    const backup = [collection('root'), collection('nested', 'root'), model]
    expect(await targetService.import(backup)).to.equal('ok')
    const closureBefore = await target.query(
      'SELECT * FROM CollectionEntity_closure ORDER BY id_ancestor, id_descendant',
    )
    model.name = 'Updated connection'
    model.messages[0].payload = 'updated'
    expect(await targetService.import(backup)).to.equal('ok')
    for (const entity of [ConnectionEntity, MessageEntity, SubscriptionEntity, WillEntity]) {
      expect(await target.getRepository(entity).count()).to.equal(1)
    }
    expect(
      await target.query('SELECT * FROM CollectionEntity_closure ORDER BY id_ancestor, id_descendant'),
    ).to.deep.equal(closureBefore)
    expect((await target.getRepository(ConnectionEntity).findOne('inside'))!.name).to.equal('Updated connection')
    expect((await target.getRepository(MessageEntity).findOne('message'))!.payload).to.equal('updated')
    expect((await target.getRepository(MessageEntity).findOne('message'))!.userProperties).to.equal(
      '{"source":"backup"}',
    )
    expect((await target.getRepository(SubscriptionEntity).findOne('sub'))!.userProperties).to.equal(
      '{"source":"backup"}',
    )
  })

  it('updates existing group parents using the closure tree, including moves back to the root', async () => {
    expect(await targetService.import([collection('root'), collection('nested', 'root')])).to.equal('ok')
    expect(await targetService.import([collection('root', 'nested'), collection('nested')])).to.equal('ok')
    const tree = await target.getTreeRepository(CollectionEntity).findTrees()
    expect(tree[0].id).to.equal('nested')
    expect(tree[0].children.map((item) => item.id)).to.deep.equal(['root'])
    expect(await target.getTreeRepository(CollectionEntity).findAncestors(tree[0])).to.have.lengthOf(1)
  })

  it('restores an older snapshot whose will is no longer owned by a connection', async () => {
    const original = connection('snapshot')
    original.will = {
      id: 'original-will',
      lastWillTopic: 'will',
      lastWillPayload: 'original',
      lastWillQos: 1,
      lastWillRetain: false,
    }
    const newer = { ...original, name: 'Newer snapshot', will: { ...original.will, id: 'newer-will' } }
    expect(await targetService.import([original])).to.equal('ok')
    expect(await targetService.import([newer])).to.equal('ok')
    expect(await targetService.import([original])).to.equal('ok')
    const restored = (await target.getRepository(ConnectionEntity).findOne(original.id, { relations: ['will'] }))!
    expect(restored.name).to.equal(original.name)
    expect(restored.will!.id).to.equal('original-will')
    expect(restored.will!.lastWillPayload).to.equal('original')
  })

  for (const kind of ['connection', 'collection'] as const) {
    it(`rejects an existing ${kind} ID used for the other entity type`, async () => {
      if (kind === 'connection') await seed(target, connection('collision'))
      else await target.getRepository(CollectionEntity).save({ id: 'collision', name: 'Existing' })
      const records = kind === 'connection' ? [collection('collision')] : [connection('collision')]
      expect(await targetService.import(records)).to.contain('Conflicting')
      expect(await target.getRepository(ConnectionEntity).count()).to.equal(kind === 'connection' ? 1 : 0)
      expect(await target.getRepository(CollectionEntity).count()).to.equal(kind === 'collection' ? 1 : 0)
    })
  }

  for (const kind of ['messages', 'subscriptions', 'will'] as const) {
    it(`rejects ${kind} IDs owned by another connection and rolls back the whole backup`, async () => {
      await seed(target, connection('owner'))
      const model = connection('new', 'new-group')
      if (kind === 'messages') {
        await target.getRepository(MessageEntity).save({ ...message('collision'), connectionId: 'owner' })
        model.messages = [message('collision')]
      } else if (kind === 'subscriptions') {
        await target
          .getRepository(SubscriptionEntity)
          .save({ id: 'collision', topic: 'owner/#', connectionId: 'owner' })
        model.subscriptions = [{ id: 'collision', topic: 'new/#', qos: 1 } as SubscriptionModel]
      } else {
        const owner = (await target.getRepository(ConnectionEntity).findOne('owner', { relations: ['will'] }))!
        model.will = {
          id: owner.will!.id,
          lastWillTopic: '',
          lastWillPayload: '',
          lastWillQos: 0,
          lastWillRetain: false,
        }
      }
      expect(await targetService.import([collection('new-group'), model])).to.contain('Conflicting')
      expect(await target.getRepository(CollectionEntity).count()).to.equal(0)
      expect(await target.getRepository(ConnectionEntity).count()).to.equal(1)
      expect((await target.getRepository(ConnectionEntity).findOne('owner'))!.name).to.equal('owner')
    })
  }

  const invalidCases: Array<[string, any]> = [
    ['null input', null],
    ['object instead of array', {}],
    ['empty array', []],
    ['null record', [null]],
    ['missing group ID', [{ ...collection('group'), id: undefined }]],
    ['duplicate ID', [collection('group'), collection('group')]],
    ['duplicate ID across types', [collection('group'), connection('group')]],
    ['missing parent', [collection('group', 'missing')]],
    ['self cycle', [collection('group', 'group')]],
    ['two-group cycle', [collection('a', 'b'), collection('b', 'a')]],
    ['missing connection parent', [collection('group'), connection('connection', 'missing')]],
    ['invalid discriminator', [{ ...connection('connection'), isCollection: 'true' }]],
    ['invalid connection port', [{ ...connection('connection'), port: '1883' }]],
    ['invalid messages', [{ ...connection('connection'), messages: {} }]],
    ['null subscription', [{ ...connection('connection'), subscriptions: [null] }]],
    ['duplicate child IDs', [{ ...connection('connection'), messages: [message('same'), message('same')] }]],
    ['invalid will', [{ ...connection('connection'), will: [] }]],
    ['embedded parent relation', [{ ...connection('connection'), parent: { id: 'foreign' } }]],
    [
      'embedded message relation',
      [{ ...connection('connection'), messages: [{ ...message('message'), connection: { id: 'foreign' } }] }],
    ],
    ['invalid MQTT properties', [{ ...connection('connection'), properties: [] }]],
  ]
  for (const [name, records] of invalidCases) {
    it(`rejects ${name} without writing any entities`, async () => {
      expect(await targetService.import(records)).not.to.equal('ok')
      expect(await target.getRepository(CollectionEntity).count()).to.equal(0)
      expect(await target.getRepository(ConnectionEntity).count()).to.equal(0)
      expect(await target.getRepository(WillEntity).count()).to.equal(0)
    })
  }

  it('rolls back group changes, connections, wills, subscriptions and messages on a late SQLite error', async () => {
    const original = connection('existing', 'group')
    original.messages = [message('original-message')]
    original.subscriptions = [{ id: 'original-sub', topic: 'original/#', qos: 0 } as SubscriptionModel]
    expect(await targetService.import([collection('group'), original])).to.equal('ok')
    const snapshot = async () => {
      const rows = []
      for (const table of [
        'CollectionEntity',
        'CollectionEntity_closure',
        'ConnectionEntity',
        'WillEntity',
        'SubscriptionEntity',
        'MessageEntity',
      ]) {
        rows.push(await target.query(`SELECT * FROM "${table}" ORDER BY rowid`))
      }
      return rows
    }
    const before = await snapshot()
    const updated = { ...original, name: 'Changed', messages: [message('added-message')], subscriptions: [] }
    const invalid = connection('invalid', 'group')
    invalid.will = { id: 'new-will', lastWillTopic: '', lastWillPayload: '', lastWillQos: 0, lastWillRetain: false }
    invalid.messages = [{ ...message('bad-message'), payload: undefined } as any]
    const status = await targetService.import([{ ...collection('group'), name: 'Changed group' }, updated, invalid])
    expect(status).to.contain('NOT NULL constraint failed')
    expect(await snapshot()).to.deep.equal(before)
    expect(await target.query('PRAGMA foreign_key_check')).to.deep.equal([])
  })

  it('imports message batches atomically and reports monotonic progress through completion', async () => {
    const model = connection('batched', 'group')
    model.messages = Array.from({ length: 1001 }, (_, index) => message(`message-${index}`))
    const progress: number[] = []
    expect(await targetService.import([collection('group'), model], (value) => progress.push(value))).to.equal('ok')
    expect(await target.getRepository(MessageEntity).count()).to.equal(1001)
    expect(progress[progress.length - 1]).to.equal(1)
    expect(progress.every((value, index) => value >= 0 && value <= 1 && (!index || value >= progress[index - 1]))).to.be
      .true
  })

  for (const format of ['YAML', 'XML', 'CSV', 'Excel'] as const) {
    it(`keeps ${format} exports connection-only`, async () => {
      await source.getRepository(CollectionEntity).save({ id: 'unrelated-group', name: 'Unrelated group' })
      await seed(source, connection('connection'))
      await source
        .getRepository(MessageEntity)
        .save({ ...MessageService.modelToEntity(message('message'), 'connection') })
      const content = await exportBackup(format)
      if (format === 'YAML') {
        const records = YAML.load(content) as ConnectionModel[]
        expect(records).to.have.lengthOf(1)
        expect(records[0].isCollection).to.equal(false)
      } else if (format === 'Excel') {
        const workbook = Excel.readFile(output)
        expect(workbook.SheetNames).to.deep.equal(['Connection_1'])
        expect(Excel.utils.sheet_to_json(workbook.Sheets.Connection_1)).to.have.lengthOf(1)
      } else {
        expect(content).not.to.contain('Unrelated group')
        expect(content).to.contain('payload')
      }
    })
  }
})
