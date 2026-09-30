import '../mocks/browserStorage'
import { expect } from 'chai'
import { createLocalVue, mount, Wrapper } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import { Container } from 'typedi'
import ConnectionsList from '@/views/connections/ConnectionsList.vue'

Vue.use(VueRouter)
const methods = (ConnectionsList as any).options.methods
const tree = [
  {
    id: 'outer',
    name: 'Outer',
    isCollection: true,
    children: [
      {
        id: 'inner',
        name: 'Inner',
        isCollection: true,
        children: [{ id: 'connection', name: 'Offline', host: '127.0.0.1', port: 1883, isCollection: false }],
      },
    ],
  },
  { id: 'other', name: 'Other', isCollection: true, children: [] },
]

describe('Desktop group expansion state', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(VueRouter)
  localVue.use(ElementUI)
  let originalGet: typeof Container.get
  let store: any
  let wrapper: Wrapper<Vue>
  const tick = async () => {
    await Vue.nextTick()
    await Vue.nextTick()
  }
  const nodes = () => (wrapper.vm.$refs.tree as any).store.nodesMap
  const open = async (id = 'connection') => {
    const router = new VueRouter({
      routes: [{ path: '/recent_connections/:id?', component: { render: (h) => h('div') } }],
    })
    await router.push(`/recent_connections/${id}`)
    const options = (ConnectionsList as any).options
    const originalMounted = options.mounted
    options.mounted = []
    wrapper = mount(ConnectionsList, {
      localVue,
      store,
      router,
      stubs: { 'el-collapse-transition': { functional: true, render: (_h: any, context: any) => context.children[0] } },
      mocks: {
        $t: (key: string) => key,
      },
    })
    options.mounted = originalMounted
    await (wrapper.vm as any).loadData(true)
    await tick()
  }

  beforeEach(() => {
    originalGet = Container.get
    ;(Container as any).get = (type: any) =>
      type.name === 'CollectionService' ? { getAll: async () => JSON.parse(JSON.stringify(tree)) } : {}
    store = new Vuex.Store({
      state: { treeState: {} as ConnectionTreeStateMap },
      getters: {
        activeConnection: () => ({}),
        unreadMessageCount: () => ({}),
        currentTheme: () => 'light',
        connectionTreeState: (state: any) => state.treeState,
      },
      actions: {
        SET_CONNECTIONS_TREE: ({ state }: any, payload: ConnectionTreeState) => {
          state.treeState[payload.id] = { expanded: payload.expanded }
        },
        UNREAD_MESSAGE_COUNT_INCREMENT: () => {},
      },
    })
  })

  afterEach(async () => {
    await tick()
    wrapper?.destroy()
    Container.get = originalGet
  })

  it('preserves collapsed nested ancestors when navigating away and returning', async () => {
    await open()
    for (const id of ['inner', 'outer']) {
      nodes()[id].expanded = false
      methods.handleNodeExpand.call(wrapper.vm, nodes()[id].data, false)
    }
    await tick()
    wrapper.destroy()
    await open()
    expect(nodes().outer.expanded).to.equal(false)
    expect(nodes().inner.expanded).to.equal(false)
    expect(store.state.treeState.outer.expanded).to.equal(false)
    expect(store.state.treeState.inner.expanded).to.equal(false)
  })

  it('preserves mixed expanded and collapsed ancestors on list refresh', async () => {
    store.state.treeState = { outer: { expanded: false }, inner: { expanded: true }, other: { expanded: false } }
    await open()
    await (wrapper.vm as any).loadData(false)
    await tick()
    expect(nodes().outer.expanded).to.equal(false)
    expect(nodes().inner.expanded).to.equal(true)
    expect(nodes().other.expanded).to.equal(false)
  })

  it('records collapsing with the expand arrow and restores it after navigation', async () => {
    await open()
    await wrapper.find('.el-tree-node__expand-icon').trigger('click')
    await tick()
    expect(nodes().outer.expanded).to.equal(false)
    expect(store.state.treeState.outer.expanded).to.equal(false)
    wrapper.destroy()
    await open()
    expect(nodes().outer.expanded).to.equal(false)
  })

  it('reveals both ancestors when explicitly switching to a hidden connection', async () => {
    store.state.treeState = { outer: { expanded: false }, inner: { expanded: false }, other: { expanded: false } }
    await open('another-connection')
    methods.handleConnectionIdChanged.call(wrapper.vm, 'connection')
    await tick()
    expect(nodes().outer.expanded).to.equal(true)
    expect(nodes().inner.expanded).to.equal(true)
    expect(nodes().other.expanded).to.equal(false)
    expect((wrapper.vm.$refs.tree as any).getCurrentKey()).to.equal('connection')
  })

  it('locates the selected connection when no expansion state exists after a fresh start', async () => {
    await open()
    expect(nodes().outer.expanded).to.equal(true)
    expect(nodes().inner.expanded).to.equal(true)
    expect(nodes().other.expanded).to.equal(false)
  })

  for (const id of ['', '0', 'deleted-connection']) {
    it(`preserves state when the route has no existing connection (${id || 'empty'})`, async () => {
      store.state.treeState = { outer: { expanded: false }, inner: { expanded: true }, removed: { expanded: true } }
      await open(id)
      expect(nodes().outer.expanded).to.equal(false)
      expect(nodes().inner.expanded).to.equal(true)
      expect(nodes().removed).to.equal(undefined)
    })
  }
})
