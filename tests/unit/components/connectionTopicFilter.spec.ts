import '../mocks/browserStorage'
import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import { Container } from 'typedi'
import ElementUI from 'element-ui'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'

const methods = (ConnectionsDetail as any).options.methods
const record = { id: 'A', name: 'A', mqttVersion: '5.0', subscriptions: [{ topic: 'a/#' }], messages: [] }

describe('Desktop topic filter transitions', () => {
  it('shows the current filter and clearing reloads messages while preserving search', async () => {
    const localVue = createLocalVue()
    localVue.use(Vuex)
    localVue.use(ElementUI)
    let reloads = 0
    const options = {
      ...(ConnectionsDetail as any).options,
      created: [],
      mounted: [],
      beforeDestroy: [],
      watch: {},
      methods: {
        ...methods,
        loadMessages: () => {
          reloads++
        },
      },
    }
    const wrapper = shallowMount(options, {
      localVue,
      propsData: { record },
      mocks: {
        $route: { params: { id: 'A' }, name: 'ConnectionsDetail' },
        $t: (key: string) => key,
        $tc: (key: string) => key,
      },
      store: new Vuex.Store({
        getters: {
          activeConnection: () => ({}),
          currentTheme: () => 'light',
          showConnectionList: () => true,
          showClientInfo: () => ({}),
          enableCopilot: () => false,
        },
      }),
    })
    await wrapper.setData({ activeTopic: 'a/#', searchParams: { topic: 'temp', payload: '' } })
    expect(wrapper.find('.topic-filter-value').text()).to.equal('a/#')
    await wrapper.find('.clear-topic-filter').trigger('click')
    expect((wrapper.vm as any).activeTopic).to.equal('')
    expect((wrapper.vm as any).searchParams.topic).to.equal('temp')
    expect(wrapper.find('.topic-filter').exists()).to.be.false
    expect(reloads).to.equal(1)
    wrapper.destroy()
  })

  it('resets the topic filter and invalidates pending messages when connections change', () => {
    const context = { activeTopic: 'a/#', messageQueryVersion: 1 }
    methods.resetTopicFilter.call(context)
    expect(context).to.deep.equal({ activeTopic: '', messageQueryVersion: 2 })
  })

  it('clears only when the deleted topic was selected', () => {
    let clears = 0
    const context = {
      activeTopic: 'a/#',
      clearTopicFilter: () => {
        clears++
      },
    }
    methods.handleTopicDelete.call(context, 'b/#')
    expect(clears).to.equal(0)
    methods.handleTopicDelete.call(context, 'a/#')
    expect(clears).to.equal(1)
  })

  it('clears a filter when its subscription is removed or disabled', () => {
    let clears = 0
    const context = {
      activeTopic: 'a/#',
      record: { subscriptions: [{ topic: 'a/#', disabled: false }] },
      clearTopicFilter: () => {
        clears++
      },
    }
    methods.handleSubscriptionsChanged.call(context)
    expect(clears).to.equal(0)
    context.record.subscriptions[0].disabled = true
    methods.handleSubscriptionsChanged.call(context)
    expect(clears).to.equal(1)
  })
  it('ignores a history response that finishes after a newer clear operation', async () => {
    const originalGet = Container.get
    const pending: Array<(value: any) => void> = []
    ;(Container as any).get = (service: any) =>
      service.name === 'MessageService' ? { get: () => new Promise((resolve) => pending.push(resolve)) } : {}
    const vm = {
      ...methods,
      curConnectionId: 'A',
      activeTopic: 'a/#',
      msgType: 'all',
      searchParams: { topic: 'temp', payload: '' },
      messageQueryVersion: 0,
      recordMsgs: {},
    }
    try {
      const selected = vm.getMessages()
      vm.activeTopic = ''
      const cleared = vm.getMessages()
      pending[1]({ list: [{ topic: 'b/temp' }], total: 1 })
      await cleared
      pending[0]({ list: [{ topic: 'a/temp' }], total: 1 })
      await selected
      expect((vm.recordMsgs as any).list).to.deep.equal([{ topic: 'b/temp' }])
    } finally {
      Container.get = originalGet
    }
  })

  it('positions the filter below the measured search/connection panel height', () => {
    const computed = (ConnectionsDetail as any).options.computed
    const vm = { connectionTopbarHeight: 307, showClientInfo: true }
    expect(computed.bodyTopValue.get.call(vm)).to.equal('307px')
    expect(computed.msgTopValue.get.call(vm)).to.equal('339px')
  })
})
