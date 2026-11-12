import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import { createLocalVue, mount } from '@vue/test-utils'
import { Button, Table, TableColumn } from 'element-ui'
import { ipcRenderer } from 'electron'
import MsgLeftItem from '@/components/MsgLeftItem.vue'
import MsgRightItem from '@/components/MsgRightItem.vue'
import FullMsgDialog from '@/components/FullMsgDialog.vue'
import messages from '@/lang'
import app from '@/store/modules/app'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueI18n)
const i18n = new VueI18n({
  locale: 'en',
  messages: messages,
})
const translate = (key: string, values = {}) => (key.startsWith('connections.') ? i18n.t(key, values) : key)
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
  mount(component, {
    localVue,
    sync: false,
    propsData,
    stubs: { FullMsgDialog: true, MqttProperties: true },
    store: new Vuex.Store({ getters: { jsonHighlight: () => false, currentTheme: () => 'light' } }),
    mocks: { $t: translate, $tc: i18n.tc.bind(i18n) },
  })
const mountDialog = async (propsData: any) => {
  const vue = createLocalVue()
  vue.use(Button)
  vue.use(Table)
  vue.use(TableColumn)
  const wrapper = mount(FullMsgDialog, {
    localVue: vue,
    sync: false,
    propsData: { visible: true, msgId: 'batch', msgType: 'Plaintext', ...propsData },
    stubs: { 'el-dialog': { template: '<div><slot/><slot name="footer"/></div>' } },
    mocks: { $t: translate },
  })
  await Vue.nextTick()
  return wrapper
}

describe('Batch message display', () => {
  let originalAsync: boolean
  beforeEach(() => {
    originalAsync = Vue.config.async
  })
  afterEach(() => {
    Vue.config.async = originalAsync
  })
  it('previews only the first five items', () => {
    const wrapper = mountMessage(props())
    expect(wrapper.findAll('.batch-content').wrappers.map((row) => row.text())).to.deep.equal([
      'item 1',
      'item 2',
      'item 3',
      'item 4',
      'item 5',
    ])
    wrapper.destroy()
  })
  it('keeps an empty item as a numbered row', () => {
    const wrapper = mountMessage({ ...props(), payload: JSON.stringify(['one', '', 'three']) })
    expect(wrapper.findAll('.batch-row').at(1).text()).to.equal('2')
    wrapper.destroy()
  })
  it('shows the full item text in its tooltip', () => {
    const text = JSON.stringify({ id: 'device-004', value: 'x'.repeat(400) })
    const wrapper = mountMessage({ ...props(), payload: JSON.stringify([text]) })
    expect(wrapper.find('.batch-content').attributes('title')).to.equal(text)
    wrapper.destroy()
  })
  it('offers no See More button when all items fit in the preview', () => {
    for (const count of [2, 5]) {
      const wrapper = mountMessage({ ...props(), payload: JSON.stringify(Array(count).fill('item')) })
      expect(wrapper.find('.see-more-btn').exists()).to.equal(false)
      wrapper.destroy()
    }
  })
  it('opens the full Batch with See More', async () => {
    const wrapper = mountMessage(props())
    expect(wrapper.find('.see-more-btn').text()).to.equal('common.seeMore')
    await wrapper.find('.see-more-btn').trigger('click')
    expect(wrapper.find(FullMsgDialog).props('batchItems')).to.deep.equal(JSON.parse(props().payload))
    expect(wrapper.find(FullMsgDialog).props('exportText')).to.equal(props().payload)
    wrapper.destroy()
  })
  it('renders binary items as a hex prefix with their decoded byte size', () => {
    const bytes = Buffer.concat([Buffer.from('4f2a9c', 'hex'), Buffer.alloc(61, 255)])
    const wrapper = mountMessage({ ...props(), payload: JSON.stringify([{ b64: bytes.toString('base64') }]) })
    expect(wrapper.find('.batch-content').text()).to.equal('4f2a9cffffff… (binary, 64 B)')
    expect(wrapper.find('.batch-content').attributes('title')).to.equal(bytes.toString('hex'))
    wrapper.destroy()
  })
  it('shows the logical topic in the header and the wire topic in its tooltip', () => {
    const wrapper = mountMessage(props())
    expect(wrapper.find('.topic').text()).to.equal('Topic: demo')
    expect(wrapper.find('.topic').attributes('title')).to.equal('$batch/250/demo')
    wrapper.destroy()
  })
  it('highlights searches in the displayed logical topic', () => {
    const wrapper = mountMessage({ ...props(), searchParams: { topic: 'emo', payload: '' } })
    expect(wrapper.find('.topic .search-highlight').text()).to.equal('emo')
    wrapper.destroy()
  })
  it('shows the saved summary count without See More', () => {
    for (const [count, saved, unit] of [
      [1, 1, 'item'],
      [250, 20, 'items'],
    ] as const) {
      const data = props(true)
      data.payload = JSON.stringify(Array(saved).fill('item'))
      data.meta = JSON.stringify({ ...JSON.parse(data.meta), batch: { ...JSON.parse(data.meta).batch, count } })
      const wrapper = mountMessage(data)
      expect(wrapper.find('.batch-summary').text()).to.equal(
        `Summary only: first ${saved} of ${count} ${unit}, up to the first 32 B each`,
      )
      expect(wrapper.find('.see-more-btn').exists()).to.equal(false)
      wrapper.destroy()
    }
  })
  it('renders failed batches as an error tag and hex preview with zero items', () => {
    const wrapper = mountMessage(props(false, 'BATCH_LIMIT_EXCEEDED'))
    expect(wrapper.findAll('.batch-row')).to.have.length(0)
    expect(wrapper.find('.msg-tag').text()).to.include('BATCH_LIMIT_EXCEEDED')
    expect(wrapper.find('.batch-hex').text()).to.equal('0000ff')
    expect(wrapper.find('.batch-notice').text()).to.equal('Batch validation failed. A hex preview was saved.')
    wrapper.destroy()
  })
  it('labels the hex preview length only when it is truncated', async () => {
    const message = props(false, 'TRUNCATED_ITEM')
    const meta = JSON.parse(message.meta)
    meta.payloadBytes = 3
    const wrapper = mountMessage({ ...message, meta: JSON.stringify(meta) })
    expect(wrapper.find('.batch-preview-note').exists()).to.equal(false)
    meta.payloadBytes = 10
    await wrapper.setProps({ meta: JSON.stringify(meta) })
    expect(wrapper.find('.batch-preview-note').text()).to.equal('Preview: 3 B of 10 B')
    wrapper.destroy()
  })
  it('shows when item conversion fails and text is saved', () => {
    const message = props()
    const wrapper = mountMessage({
      ...message,
      meta: JSON.stringify({ ...JSON.parse(message.meta), batchConversionFallback: true }),
    })
    expect(wrapper.find('.batch-notice').text()).to.equal('Some items could not be converted and were saved as text')
    wrapper.destroy()
  })
  it('rebuilds published Hex items as decoded binary previews', () => {
    const meta = JSON.parse(props().meta)
    meta.batch.payloadType = 'Hex'
    const wrapper = mountMessage(
      { ...props(), meta: JSON.stringify(meta), payload: '4f2a9c00010203\n4142' },
      MsgRightItem,
    )
    expect(wrapper.findAll('.batch-content').wrappers.map((row) => row.text())).to.deep.equal([
      '4f2a9c000102… (binary, 7 B)',
      '4142 (binary, 2 B)',
    ])
    wrapper.destroy()
  })
  it('falls back to Plaintext lines for published legacy history', () => {
    const wrapper = mountMessage({ ...props(), payload: 'é\n\nlast\n' }, MsgRightItem)
    expect(wrapper.findAll('.batch-content').wrappers.map((row) => row.text())).to.deep.equal(['é', '', 'last'])
    expect(wrapper.find('.batch-notice').exists()).to.equal(false)
    wrapper.destroy()
  })
  it('hides the pager for one page and navigates longer batches from the footer', async () => {
    const wrapper = await mountDialog({ batchItems: ['one', 'two', 'three', 'four', 'five'], exportText: '' })
    expect(wrapper.find('.batch-pager').exists()).to.equal(false)
    await wrapper.setProps({
      batchItems: JSON.parse(props().payload),
      exportText: props().payload,
      exportFormat: 'json',
    })
    const list = wrapper.find('.el-table__body-wrapper').element as HTMLElement
    list.scrollTop = 120
    expect(wrapper.find('.batch-pager .history-btn-left').attributes('disabled')).to.equal('disabled')
    await wrapper.find('.batch-pager .history-btn-right').trigger('click')
    expect(wrapper.find('tbody .batch-content').text()).to.equal('item 101')
    expect(wrapper.find('.batch-pager .history-btn-center').text()).to.equal('2/3')
    expect(list.scrollTop).to.equal(0)
    wrapper.destroy()
  })
  it('shows 100 items per page through the last page', async () => {
    const wrapper = await mountDialog({
      batchItems: JSON.parse(props().payload),
      exportText: props().payload,
      exportFormat: 'json',
    })
    const vm = wrapper.vm as any
    expect(wrapper.findAll('tbody tr')).to.have.length(100)
    vm.batchPage = 3
    await vm.$nextTick()
    expect(wrapper.findAll('tbody tr')).to.have.length(50)
    expect(wrapper.find('tbody .batch-index').text()).to.equal('201')
    expect(wrapper.findAll('tbody .batch-content').at(49).text()).to.equal('item 250')
    wrapper.destroy()
  })
  it('shows UTF-8 and binary byte sizes in the compact table', async () => {
    const wrapper = await mountDialog({ batchItems: ['é', { b64: '/w==' }], exportText: '' })
    expect(wrapper.findAll('tbody .batch-size').wrappers.map((row) => row.text())).to.deep.equal(['2 B', '1 B'])
    expect(wrapper.find('tbody .batch-muted').text()).to.equal('(binary)')
    wrapper.destroy()
  })
  it('keeps the complete saved payload for export', async () => {
    const payload = props().payload
    const wrapper = await mountDialog({ batchItems: JSON.parse(payload), exportText: payload, exportFormat: 'json' })
    const originalSend = ipcRenderer.send
    let exported: any[] = []
    ipcRenderer.send = (...args: any[]) => {
      exported = args
    }
    try {
      ;(wrapper.vm as any).saveDataToLocal()
      expect(exported).to.deep.equal(['exportTextData', 'payload', payload, 'json'])
      await wrapper.setProps({ exportFormat: 'txt', exportText: 'first\n\nlast\n' })
      await (wrapper.vm as any).loadMsg()
      ;(wrapper.vm as any).saveDataToLocal()
      expect(exported).to.deep.equal(['exportTextData', 'payload', 'first\n\nlast\n', 'txt'])
    } finally {
      ipcRenderer.send = originalSend
      wrapper.destroy()
    }
  })
})

describe('Batch settings persistence', () => {
  it('uses defaults for missing settings and rejects invalid values', () => {
    expect(app.state).to.include({
      batchPublishEnabled: false,
      batchStorageMode: 'full',
      batchMaxItems: 256,
      batchMaxBytes: 65536,
    })
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
