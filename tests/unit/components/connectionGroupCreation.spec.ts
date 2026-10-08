import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import VueRouter, { RawLocation, Route } from 'vue-router'
import Vuex from 'vuex'
import ElementUI from 'element-ui'
import { createLocalVue, mount } from '@vue/test-utils'
import { Container } from 'typedi'
import { Connection, createConnection } from 'typeorm'
import ConnectionsList from '@/views/connections/ConnectionsList.vue'
import ConnectionForm from '@/views/connections/ConnectionForm.vue'
import ConnectionService from '@/database/services/ConnectionService'
import CollectionService from '@/database/services/CollectionService'
import WillService from '@/database/services/WillService'
import { getDefaultRecord } from '@/utils/mqttUtils'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(Vuex)
localVue.use(ElementUI)
const listMethods = (ConnectionsList as any).options.methods
const formMethods = (ConnectionForm as any).options.methods
const record = (): ConnectionModel => ({
  ...getDefaultRecord(),
  name: 'Group regression',
  clientId: 'group-regression',
  host: '127.0.0.1',
  reconnect: false,
})

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
    const collectionService = new CollectionService(
      database.getRepository(CollectionEntity),
      database.getRepository(ConnectionEntity),
      database.getRepository(WillEntity),
    )
    const willService = new WillService(database.getRepository(WillEntity))
    originalGet = Container.get
    ;(Container as any).get = (type: any) => {
      if (type === ConnectionService) return service
      if (type === CollectionService) return collectionService
      if (type === WillService) return willService
      return {}
    }
    router = new VueRouter({ routes: [{ path: '/recent_connections/:id', component: { render: (h) => h('div') } }] })
  })

  afterEach(async () => {
    Container.get = originalGet
    if (database?.isConnected) await database.close()
  })

  const createRoute = (selectedCollection: Pick<CollectionModel, 'id'> | null = null) => {
    let location: RawLocation = ''
    listMethods.handleCommand.call(
      { selectedCollection, $router: { push: (value: RawLocation) => (location = value) } },
      'newConnection',
    )
    return router.resolve(location).route
  }

  const createForm = async (route: Route, data = record()) => {
    const context = {
      ...formMethods,
      oper: 'create',
      record: data,
      defaultRecord: data,
      $route: route,
      $log: { info: () => {} },
    }
    await context.initRecord()
    await context.loadCollectionOptions()
    return context
  }

  for (const nested of [false, true]) {
    it(`saves a connection inside the selected ${nested ? 'nested' : 'top-level'} group`, async () => {
      const repo = database.getRepository(CollectionEntity)
      const parent = nested ? await repo.save({ name: 'Outer' }) : undefined
      const group = await repo.save({ name: 'Selected', parent })
      const route = createRoute(group)
      expect(route.query.parentId).to.equal(group.id)
      const form = await createForm(route)
      const saved = await form.saveData()
      expect((await database.getRepository(ConnectionEntity).findOne(saved.id))?.parentId).to.equal(group.id)
    })
  }

  it('creates at the root when no group is selected, including after selecting a connection', async () => {
    const context = { selectedCollection: { id: 'old-group' }, selectedConnection: null, $refs: {} }
    listMethods.handleConnectionTreeClick.call(context, { ...record(), id: 'existing' })
    expect(context.selectedCollection).to.equal(null)
    const route = createRoute(context.selectedCollection)
    expect(route.query.parentId).to.equal(undefined)
    const form = await createForm(route)
    expect((await form.saveData()).parentId).to.equal(null)
  })

  it('falls back to the root if the selected group is deleted before saving', async () => {
    const repo = database.getRepository(CollectionEntity)
    const group = await repo.save({ name: 'Deleted' })
    const form = await createForm(createRoute(group))
    await repo.delete(group.id)
    expect((await form.saveData()).parentId).to.equal(null)
  })

  it('uses the same group for Save and Connect and removes creation query on navigation', async () => {
    const group = await database.getRepository(CollectionEntity).save({ name: 'Selected' })
    for (const type of ['save', 'connect']) {
      const destinations: any[] = []
      const context: any = {
        ...(await createForm(createRoute(group), { ...record(), name: type, clientId: type })),
        $router: { push: (location: any) => destinations.push(location) },
        $tc: (key: string) => key,
        $message: { success: () => {} },
        $emit: () => {},
        changeActiveConnection: () => {},
        validateForm: async () => true,
      }
      await context.handleSave(type)
      const saved = await database.getRepository(ConnectionEntity).findOne({ name: type })
      expect(saved?.parentId).to.equal(group.id)
      expect(router.resolve(destinations[0]).route.query).to.deep.equal({})
    }
  })

  it('shows the default group and saves the group chosen in the visible selector', async () => {
    const repo = database.getRepository(CollectionEntity)
    const initial = await repo.save({ name: 'Initial' })
    const chosen = await repo.save({ name: 'Chosen', parent: initial })
    await service.create({ ...record(), name: 'Existing', parentId: initial.id })
    await router.push(createRoute(initial).fullPath)
    const wrapper = mount<Vue>(ConnectionForm, {
      localVue,
      router,
      propsData: { oper: 'create' },
      store: new Vuex.Store({
        getters: {
          currentTheme: () => 'light',
          showConnectionList: () => true,
          advancedVisible: () => false,
          willMessageVisible: () => false,
        },
      }),
      mocks: {
        $t: (key: string) => key,
        $tc: (key: string) => key,
        $log: { info: () => {} },
      },
      // Legacy test-utils supports false stubs, but its typings omit that value.
      stubs: { transition: false, 'transition-group': false, Editor: true, KeyValueEditor: true } as any,
    })
    try {
      const form = wrapper.vm as any
      await form.loadCollectionOptions()
      await localVue.nextTick()
      const item = wrapper.findAll({ name: 'ElFormItem' }).wrappers.find((item) => item.props('prop') === 'parentId')!
      const select = item.find({ name: 'ElSelect' })
      expect(select.props('clearable')).to.equal(true)
      expect(select.findAll({ name: 'ElOption' }).wrappers.map((option) => option.props('value'))).to.have.members([
        initial.id,
        chosen.id,
      ])
      expect((select.find('input').element as HTMLInputElement).value).to.equal('Initial')
      select.vm.$emit('input', chosen.id)
      await localVue.nextTick()
      await localVue.nextTick()
      expect((select.find('input').element as HTMLInputElement).value).to.equal('Initial / Chosen')
      form.record = { ...form.record, ...record(), parentId: form.record.parentId }
      const saved = await form.saveData()
      expect((await database.getRepository(ConnectionEntity).findOne(saved.id))?.parentId).to.equal(chosen.id)

      select.vm.$emit('input', '')
      await localVue.nextTick()
      await localVue.nextTick()
      expect((select.find('input').element as HTMLInputElement).value).to.equal('')
      form.record.name = 'Ungrouped'
      const ungrouped = await form.saveData()
      expect((await database.getRepository(ConnectionEntity).findOne(ungrouped.id))?.parentId).to.equal(null)
    } finally {
      await (wrapper.vm as any).loadCollectionOptions()
      wrapper.destroy()
    }
  })

  it('can move an existing connection to another group or back to no group from the form', async () => {
    const repo = database.getRepository(CollectionEntity)
    const initial = await repo.save({ name: 'Initial' })
    const chosen = await repo.save({ name: 'Chosen' })
    const saved = await service.create({ ...record(), parentId: initial.id })
    const form = {
      ...formMethods,
      oper: 'edit',
      record: record(),
      $route: { params: { id: saved!.id }, query: { parentId: chosen.id } },
      $log: { info: () => {} },
    }
    await form.initRecord()
    await form.loadCollectionOptions()
    expect(form.record.parentId).to.equal(initial.id)
    form.record.parentId = chosen.id
    expect((await form.saveData()).parentId).to.equal(chosen.id)
    form.record.parentId = ''
    expect((await form.saveData()).parentId).to.equal(null)
  })
})
