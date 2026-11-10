import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import MsgLeftItem from '@/components/MsgLeftItem.vue'
import MsgRightItem from '@/components/MsgRightItem.vue'
import FullMsgDialog from '@/components/FullMsgDialog.vue'
import { formatBytes } from '@/utils/formatter'
import app from '@/store/modules/app'

const localVue = createLocalVue()
localVue.use(Vuex)
const props = (summary = false, error?: string) => ({
  topic: '$batch/250/demo',
  qos: 1,
  createAt: '',
  msgId: 'batch',
  payload: error
    ? '0000ff'
    : JSON.stringify(Array.from({ length: summary ? 20 : 250 }, (_, index) => `item ${index + 1}`)),
  meta: JSON.stringify({
    batch: {
      carrier: 'topic',
      logicalTopic: 'demo',
      count: 250,
      ...(summary ? { summary: true } : {}),
      ...(error ? { error } : {}),
    },
    payloadBytes: 12345,
    ...(error ? { msgError: error } : {}),
  }),
})
const mountMessage = (propsData: any, component: any = MsgLeftItem) =>
  shallowMount(component, {
    localVue,
    sync: false,
    propsData,
    store: new Vuex.Store({ getters: { jsonHighlight: () => false, currentTheme: () => 'light' } }),
    mocks: { $t: (key: string) => key },
  })

describe('Batch message display', () => {
  let originalAsync: boolean
  beforeEach(() => {
    originalAsync = Vue.config.async
  })
  afterEach(() => {
    Vue.config.async = originalAsync
  })
  it('renders five items, wire and logical topics, formatted payload size, and a full-data entry', () => {
    const wrapper = mountMessage(props())
    expect(wrapper.findAll('.batch-items li')).to.have.length(5)
    expect(wrapper.text())
      .to.include('Batch ×250')
      .and.include('$batch/250/demo')
      .and.include('demo')
      .and.include(formatBytes(12345))
    expect(wrapper.text()).to.include('connections.batchViewAll')
    wrapper.destroy()
  })
  it('limits summary display to saved items and offers no full-data entry', async () => {
    const wrapper = mountMessage(props(true))
    expect(wrapper.text()).to.include('connections.batchSummary')
    expect(wrapper.text()).not.to.include('connections.batchViewAll')
    ;(wrapper.vm as any).batchExpanded = true
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.batch-items li')).to.have.length(20)
    wrapper.destroy()
  })
  it('renders failed batches as a diagnostic and hex preview with zero items', () => {
    const wrapper = mountMessage(props(false, 'BATCH_LIMIT_EXCEEDED'))
    expect(wrapper.findAll('.batch-items li')).to.have.length(0)
    expect(wrapper.text()).to.include('BATCH_LIMIT_EXCEEDED').and.include('connections.batchLimitUnparsed')
    expect(wrapper.find('.batch-hex').text()).to.equal('0000ff')
    expect(wrapper.text()).not.to.include('connections.batchViewAll')
    wrapper.destroy()
  })
  it('keeps outgoing editor text alongside its Batch tag', () => {
    const wrapper = mountMessage({ ...props(), payload: 'first\nsecond' }, MsgRightItem)
    expect(wrapper.text()).to.include('Batch ×250').and.include('first\nsecond')
    wrapper.destroy()
  })
  it('paginates saved arrays at 100 items and exports the complete saved payload', async () => {
    const payload = props().payload
    const wrapper = shallowMount(FullMsgDialog, {
      localVue,
      sync: false,
      propsData: { visible: true, msgId: 'batch', msgType: 'Plaintext', batchPayload: payload },
      mocks: { $t: (key: string) => key },
    })
    const vm = wrapper.vm as any
    expect(vm.batchPageItems).to.have.length(100)
    vm.batchPage = 2
    expect(vm.batchPageItems[0]).to.equal('item 101')
    vm.batchPage = 3
    expect(vm.batchPageItems).to.have.length(50)
    expect(vm.batchPageItems[49]).to.equal('item 250')
    expect(vm.fullMsg).to.equal(payload)
    expect(vm.format).to.equal('json')
    wrapper.destroy()
  })
})

describe('Batch settings persistence', () => {
  it('uses defaults for old configurations and rejects invalid actions without committing', () => {
    expect(app.state).to.include({ batchStorageMode: 'full', batchMaxItems: 100, batchMaxBytes: 65536 })
    const commits: any[] = []
    const context = { commit: (...args: any[]) => commits.push(args) }
    for (const value of [0, 65536, 1.5, NaN, Infinity])
      app.actions.SET_BATCH_MAX_ITEMS(context, { batchMaxItems: value } as App)
    for (const value of [0, 1023, 1048577, 1024.5, NaN, Infinity])
      app.actions.SET_BATCH_MAX_BYTES(context, { batchMaxBytes: value } as App)
    app.actions.SET_BATCH_STORAGE_MODE(context, { batchStorageMode: 'invalid' as any } as App)
    expect(commits).to.have.length(0)
    app.actions.SET_BATCH_MAX_ITEMS(context, { batchMaxItems: 65535 } as App)
    app.actions.SET_BATCH_MAX_BYTES(context, { batchMaxBytes: 1048576 } as App)
    app.actions.SET_BATCH_STORAGE_MODE(context, { batchStorageMode: 'summary' } as App)
    expect(commits).to.deep.equal([
      ['SET_BATCH_MAX_ITEMS', 65535],
      ['SET_BATCH_MAX_BYTES', 1048576],
      ['SET_BATCH_STORAGE_MODE', 'summary'],
    ])
  })
})
