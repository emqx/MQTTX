import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { Container } from 'typedi'
import { Connection, createConnection } from 'typeorm'
import ConnectionsList from '@/views/connections/ConnectionsList.vue'
import ConnectionForm from '@/views/connections/ConnectionForm.vue'
import ConnectionService from '@/database/services/ConnectionService'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'

Vue.use(VueRouter)
const listMethods = (ConnectionsList as any).options.methods
const formMethods = (ConnectionForm as any).options.methods
const record = (): ConnectionModel =>
  ({
    name: 'Group regression',
    createAt: '2026-09-30 00:00:00',
    updateAt: '2026-09-30 00:00:00',
    reconnectPeriod: 4000,
    username: '',
    password: '',
    path: '/mqtt',
    certType: '',
    ca: '',
    cert: '',
    key: '',
    clientId: 'group-regression',
    host: '127.0.0.1',
    port: 1883,
    protocol: 'mqtt',
    clean: true,
    keepalive: 60,
    connectTimeout: 10,
    reconnect: false,
    ssl: false,
    mqttVersion: '5.0',
    unreadMessageCount: 0,
    isCollection: false,
    messages: [],
    subscriptions: [],
    properties: {},
  } as ConnectionModel)

describe('Creating Desktop connections in the selected group', () => {
  let database: Connection
  let service: ConnectionService
  let originalGet: typeof Container.get
  let router: VueRouter

  beforeEach(async () => {
    database = await createConnection({
      name: 'group-creation-regression',
      type: 'sqlite',
      database: ':memory:',
      entities: [
        ConnectionEntity,
        CollectionEntity,
        HistoryConnectionEntity,
        WillEntity,
        MessageEntity,
        SubscriptionEntity,
      ],
      synchronize: true,
    })
    service = new ConnectionService(
      database.getRepository(ConnectionEntity),
      database.getRepository(HistoryConnectionEntity),
      database.getRepository(WillEntity),
    )
    originalGet = Container.get
    ;(Container as any).get = (type: any) =>
      type === ConnectionService
        ? service
        : type.name === 'WillService'
        ? { save: (will: any) => database.getRepository(WillEntity).save(will) }
        : {}
    router = new VueRouter({ routes: [{ path: '/recent_connections/:id', component: { render: (h) => h('div') } }] })
  })

  afterEach(async () => {
    Container.get = originalGet
    if (database?.isConnected) await database.close()
  })

  const createRoute = (router: VueRouter, selectedCollection: any) => {
    let location: any
    listMethods.handleCommand.call(
      { selectedCollection, $router: { push: (value: any) => (location = value) } },
      'newConnection',
    )
    return router.resolve(location).route
  }

  const save = (route: any, data = record(), oper = 'create') =>
    formMethods.saveData.call({ oper, record: data, $route: route, $log: { info: () => {} } })

  for (const nested of [false, true]) {
    it(`saves a connection inside the selected ${nested ? 'nested' : 'top-level'} group`, async () => {
      const repo = database.getRepository(CollectionEntity)
      const parent = nested ? await repo.save({ name: 'Outer' }) : undefined
      const group = await repo.save({ name: 'Selected', parent })
      const route = createRoute(router, group)
      expect(route.query.parentId).to.equal(group.id)
      const saved = await save(route)
      expect(saved.parentId).to.equal(group.id)
      expect((await database.getRepository(ConnectionEntity).findOne(saved.id))?.parentId).to.equal(group.id)
    })
  }

  it('creates at the root when no group is selected, including after selecting a connection', async () => {
    const context = { selectedCollection: { id: 'old-group' }, selectedConnection: null, $refs: {} }
    listMethods.handleConnectionTreeClick.call(context, { ...record(), id: 'existing' })
    expect(context.selectedCollection).to.equal(null)
    const route = createRoute(router, context.selectedCollection)
    expect(route.query.parentId).to.equal(undefined)
    expect((await save(route, { ...record(), parentId: 'suggested-group' })).parentId).to.equal(null)
  })

  it('falls back to the root if the selected group is deleted before saving', async () => {
    const repo = database.getRepository(CollectionEntity)
    const group = await repo.save({ name: 'Deleted' })
    const route = createRoute(router, group)
    await repo.delete(group.id)
    expect((await save(route)).parentId).to.equal(null)
  })

  for (const parentId of ['invalid-id', '', ['one', 'two'], null]) {
    it(`safely handles the invalid group query ${JSON.stringify(parentId)}`, async () => {
      expect((await save({ params: { id: '0' }, query: { parentId } })).parentId).to.equal(null)
    })
  }

  it('does not persist a connection when creation is cancelled', async () => {
    const route = createRoute(router, { id: 'cancelled-group' })
    let destination = ''
    formMethods.handleBack.call(
      { oper: 'create', $router: { push: (path: string) => (destination = path) } },
      route.params.id,
    )
    expect(destination).to.equal('/recent_connections')
    expect(await database.getRepository(ConnectionEntity).count()).to.equal(0)
  })

  it('uses the same group for Save and Connect and removes creation query on navigation', async () => {
    const group = await database.getRepository(CollectionEntity).save({ name: 'Selected' })
    for (const type of ['save', 'connect']) {
      const destinations: any[] = []
      const context: any = {
        ...formMethods,
        oper: 'create',
        record: { ...record(), name: type, clientId: type },
        $route: createRoute(router, group),
        $router: { push: (location: any) => destinations.push(location) },
        $log: { info: () => {} },
        $tc: (key: string) => key,
        $message: { success: () => {} },
        $emit: () => {},
        changeActiveConnection: () => {},
        validateForm: async () => true,
      }
      await formMethods.handleSave.call(context, type)
      const saved = await database.getRepository(ConnectionEntity).findOne({ name: type })
      expect(saved?.parentId).to.equal(group.id)
      expect(router.resolve(destinations[0]).route.query).to.deep.equal({})
    }
  })

  it('preserves the existing parent when editing, regardless of the creation query', async () => {
    const group = await database.getRepository(CollectionEntity).save({ name: 'Existing' })
    const saved = await service.create({ ...record(), parentId: group.id })
    const edited = await save({ query: { parentId: 'another-group' } }, { ...saved!, name: 'Edited' }, 'edit')
    expect(edited.parentId).to.equal(group.id)
  })
})
