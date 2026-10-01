import { expect } from 'chai'
import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'
import MsgPublish from '@/components/MsgPublish.vue'
import ConnectionService from '@/database/services/ConnectionService'
import { getDefaultPublishDraft } from '@/utils/publishDraft'
import { setServices } from '../mocks/useServices'
import Editor from '../mocks/Editor.vue'

const localVue = createLocalVue()
localVue.use(Vuex)
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const stubs = [
  'el-select',
  'el-option',
  'el-option-group',
  'el-checkbox',
  'el-tooltip',
  'el-badge',
  'el-button',
  'el-dropdown',
  'el-dropdown-menu',
  'el-dropdown-item',
  'el-input',
]

describe('MsgPublish connection drafts', () => {
  let wrapper: Wrapper<Vue>
  let route: { params: { id?: string } }
  let connectionService: ConnectionService
  let payloadHistory: HistoryMessagePayloadModel[]
  let headerHistory: HistoryMessageHeaderModel[]
  let errors: string[]

  const mountPublisher = () =>
    shallowMount(MsgPublish, {
      localVue,
      store: new Vuex.Store({ getters: { currentTheme: () => 'light' } }),
      propsData: { editorHeight: 180 },
      mocks: {
        $route: route,
        $t: (key: string) => key,
        $tc: (key: string) => key,
        $message: { error: (message: string) => errors.push(message) },
        $notify: () => {},
      },
      stubs: { ...Object.fromEntries(stubs.map((tag) => [tag, true])), Editor },
    })

  beforeEach(async () => {
    // Real draft persistence in the Electron mock's temporary directory; synthetic repositories only.
    connectionService = new ConnectionService({} as any, {} as any, {} as any)
    connectionService.deletePublishDraft('draft-a')
    connectionService.deletePublishDraft('draft-b')
    connectionService.getPushProp = async () => undefined
    payloadHistory = []
    headerHistory = []
    errors = []
    setServices({
      connectionService,
      historyMessageHeaderService: { getAll: async () => headerHistory, delete: async () => {} },
      historyMessagePayloadService: { getAll: async () => payloadHistory },
    })
    route = Vue.observable({ params: { id: 'draft-a' } })
    wrapper = mountPublisher()
    await settle()
  })

  afterEach(() => {
    wrapper.destroy()
    connectionService.deletePublishDraft('draft-a')
    connectionService.deletePublishDraft('draft-b')
    setServices({})
  })

  it('keeps unsent payload, topic, QoS, retain and format with their connection', async () => {
    const vm = wrapper.vm as any
    Object.assign(vm.draft, { payload: 'unsent A', topic: 'a/request', qos: 2, retain: true, payloadType: 'Plaintext' })
    route.params.id = 'draft-b'
    await Vue.nextTick()
    expect(vm.draft).to.deep.equal(getDefaultPublishDraft())
    Object.assign(vm.draft, { payload: 'Qg==', topic: 'b/request', qos: 1, payloadType: 'Base64' })
    route.params.id = 'draft-a'
    await Vue.nextTick()
    expect(vm.draft).to.deep.equal({
      payload: 'unsent A',
      topic: 'a/request',
      qos: 2,
      retain: true,
      payloadType: 'Plaintext',
    })
    route.params.id = 'draft-b'
    await Vue.nextTick()
    expect(vm.draft).to.include({ payload: 'Qg==', topic: 'b/request', qos: 1, retain: false, payloadType: 'Base64' })
    expect(wrapper.emitted('handleSend')).to.be.undefined
  })

  it('uses defaults instead of attributing global history to a connection without a draft', async () => {
    const vm = wrapper.vm as any
    payloadHistory.push({ payload: 'global', payloadType: 'Plaintext' })
    headerHistory.push({ topic: 'global/topic', qos: 2, retain: true })
    await vm.loadHistoryData()
    route.params.id = 'draft-b'
    await Vue.nextTick()
    expect(vm.draft).to.deep.equal(getDefaultPublishDraft())
  })

  for (const payloadType of ['JSON', 'Plaintext', 'Base64', 'Hex', 'CBOR', 'MsgPack']) {
    it(`restores ${payloadType} text exactly after leaving the page and remounting`, async () => {
      const draft = { payload: '  raw\ntext\t', topic: '', qos: 0, retain: false, payloadType }
      Object.assign((wrapper.vm as any).draft, draft)
      wrapper.destroy() // Flushes even before Vue's draft watcher runs.
      wrapper = mountPublisher()
      await settle()
      expect((wrapper.vm as any).draft).to.deep.equal(draft)
      expect(errors).to.deep.equal([])
    })
  }

  it('flushes empty values when closing immediately after an edit', async () => {
    const vm = wrapper.vm as any
    Object.assign(vm.draft, { payload: '', topic: '', qos: 0, retain: false, payloadType: 'Hex' })
    window.dispatchEvent(new Event('beforeunload'))
    expect(connectionService.getPublishDraft('draft-a')).to.deep.equal(vm.draft)
    route.params.id = 'draft-b'
    await Vue.nextTick()
    route.params.id = 'draft-a'
    await Vue.nextTick()
    expect(vm.draft.payload).to.equal('')
  })

  it('coalesces edits and persists them without navigation', async () => {
    const vm = wrapper.vm as any
    vm.draft.payload = 'typing'
    await Vue.nextTick()
    vm.draft.payload = 'latest unsent edit'
    await Vue.nextTick()
    await new Promise((resolve) => setTimeout(resolve, 350))
    expect(connectionService.getPublishDraft('draft-a').payload).to.equal('latest unsent edit')
  })

  it("does not overwrite another window's newer draft when an unchanged window closes", async () => {
    const vm = wrapper.vm as any
    vm.draft.payload = 'original draft'
    vm.saveDraft()
    const child = mountPublisher()
    await settle()
    const childVm = child.vm as any
    childVm.draft.payload = 'new edit made in child window'
    childVm.saveDraft()
    child.destroy()
    window.dispatchEvent(new Event('beforeunload'))
    route.params.id = 'draft-b'
    await Vue.nextTick()
    wrapper.destroy()
    expect(connectionService.getPublishDraft('draft-a').payload).to.equal('new edit made in child window')
  })

  it('flushes to the outgoing connection when a route has no connection ID', async () => {
    const vm = wrapper.vm as any
    vm.draft.payload = 'before settings'
    route.params.id = undefined
    await Vue.nextTick()
    wrapper.destroy()
    route.params.id = 'draft-a'
    wrapper = mountPublisher()
    await settle()
    expect((wrapper.vm as any).draft.payload).to.equal('before settings')
  })

  it('keeps creation-page input separate and restores the existing connection', async () => {
    const vm = wrapper.vm as any
    vm.draft.payload = 'connection A'
    route.params.id = '0'
    await Vue.nextTick()
    vm.draft.payload = 'temporary creation input'
    route.params.id = 'draft-a'
    await Vue.nextTick()
    expect(vm.draft.payload).to.equal('connection A')
  })

  it('ignores a conversion that completes after switching connections', async () => {
    const vm = wrapper.vm as any
    vm.draft = { ...vm.draft, payload: '{"a":1}', payloadType: 'Plaintext' }
    const conversion = vm.handleTypeChange('JSON')
    route.params.id = 'draft-b'
    await Vue.nextTick()
    await conversion
    expect(vm.draft).to.deep.equal(getDefaultPublishDraft())
    route.params.id = 'draft-a'
    await Vue.nextTick()
    expect(vm.draft).to.include({ payload: '{"a":1}', payloadType: 'Plaintext' })
  })

  it('ignores outdated conversion errors and preserves newer text', async () => {
    const vm = wrapper.vm as any
    vm.draft = { ...vm.draft, payload: 'invalid JSON', payloadType: 'Plaintext' }
    const conversion = vm.handleTypeChange('JSON')
    vm.draft.payload = 'newer edit'
    await conversion
    expect(vm.draft).to.include({ payload: 'newer edit', payloadType: 'Plaintext' })
    expect(errors).to.deep.equal([])
  })

  it('discards a pending conversion when leaving the page', async () => {
    const vm = wrapper.vm as any
    vm.draft = { ...vm.draft, payload: '{"a":1}', payloadType: 'Plaintext' }
    const conversion = vm.handleTypeChange('JSON')
    wrapper.destroy()
    await conversion
    expect(connectionService.getPublishDraft('draft-a')).to.include({ payload: '{"a":1}', payloadType: 'Plaintext' })
  })

  it('applies only the latest format selection', async () => {
    const vm = wrapper.vm as any
    vm.draft = { ...vm.draft, payload: '{"a":1}', payloadType: 'Plaintext' }
    await Promise.all([vm.handleTypeChange('JSON'), vm.handleTypeChange('Base64')])
    expect(vm.draft).to.include({ payload: btoa('{"a":1}'), payloadType: 'Base64' })
  })

  it('reports a current conversion failure without changing the text or format', async () => {
    const vm = wrapper.vm as any
    vm.draft = { ...vm.draft, payload: 'invalid JSON', payloadType: 'Plaintext' }
    await vm.handleTypeChange('JSON')
    expect(vm.draft).to.include({ payload: 'invalid JSON', payloadType: 'Plaintext' })
    expect(errors).to.have.length(1)
  })

  it('allows changing the format of an empty payload', async () => {
    const vm = wrapper.vm as any
    vm.draft.payload = ''
    await vm.handleTypeChange('Base64')
    expect(vm.draft).to.include({ payload: '', payloadType: 'Base64' })
    expect(vm.payloadLang).to.equal('plaintext')
  })

  it('restores history text with its format without encoding it again', async () => {
    const vm = wrapper.vm as any
    payloadHistory.push({ payload: 'SGVsbG8=', payloadType: 'Base64' }, { payload: '41 42', payloadType: 'Hex' })
    await vm.loadHistoryData()
    vm.back()
    expect(vm.draft).to.include({ payload: '41 42', payloadType: 'Hex' })
    vm.decrease()
    expect(vm.draft).to.include({ payload: 'SGVsbG8=', payloadType: 'Base64' })
    vm.increase()
    vm.draft.payload = 'edited latest history'
    vm.back() // Selecting the same index must still restore its original text.
    expect(vm.draft).to.include({ payload: '41 42', payloadType: 'Hex' })
    vm.handleHeaderChange({ topic: 'history/topic', qos: 2, retain: true })
    expect(vm.draft).to.include({ topic: 'history/topic', qos: 2, retain: true })
  })

  it('starts history navigation at the latest entry while displaying an unsent draft', async () => {
    const vm = wrapper.vm as any
    payloadHistory.push({ payload: 'latest', payloadType: 'Plaintext' })
    await vm.loadHistoryData()
    vm.draft.payload = 'unsent'
    route.params.id = 'draft-b'
    await Vue.nextTick()
    route.params.id = 'draft-a'
    await Vue.nextTick()
    expect(vm.draft.payload).to.equal('unsent')
    expect(vm.historyIndex).to.equal(-1)
    vm.decrease()
    expect(vm.draft.payload).to.equal('latest')
    payloadHistory.unshift({ payload: 'older', payloadType: 'Plaintext' })
    route.params.id = 'draft-b'
    await Vue.nextTick()
    vm.decrease()
    expect(vm.draft.payload).to.equal('latest')
  })

  it('does not overwrite a newer edit when publish history reloads', async () => {
    const vm = wrapper.vm as any
    payloadHistory.push({ payload: 'sent', payloadType: 'Plaintext' })
    vm.draft.payload = 'new unsent edit'
    await vm.loadHistoryData(true)
    expect(vm.draft.payload).to.equal('new unsent edit')
  })

  it('does not recreate a deleted draft during pending save or teardown', async () => {
    const vm = wrapper.vm as any
    vm.draft.payload = 'unsent before deletion'
    await Vue.nextTick()
    connectionService.deletePublishDraft('draft-a')
    wrapper.destroy()
    expect(connectionService.getPublishDraft('draft-a')).to.deep.equal(getDefaultPublishDraft())
  })

  it('ignores late MQTT 5 properties and clears them on connection changes', async () => {
    let finish: (value: PushPropertiesModel) => void = () => {}
    connectionService.getPushProp = (id) =>
      id === 'draft-a'
        ? new Promise((resolve) => {
            finish = resolve
          })
        : Promise.resolve(undefined)
    await wrapper.setProps({ mqtt5PropsEnable: true })
    route.params.id = 'draft-b'
    await Vue.nextTick()
    finish({ responseTopic: 'a/response' })
    await settle()
    const vm = wrapper.vm as any
    expect(vm.MQTT5PropsSend).to.deep.equal({})
    expect(vm.hasMqtt5Prop).to.equal(false)
  })

  it('emits a message snapshot without storing send metadata in the draft', async () => {
    const vm = wrapper.vm as any
    Object.assign(vm.draft, { topic: 'request', payload: 'unsent', payloadType: 'Plaintext' })
    await wrapper.setProps({ clientConnected: true })
    await vm.send()
    const message = wrapper.emitted('handleSend')![0][0]
    expect(message).to.include({ topic: 'request', payload: 'unsent', out: true })
    expect(message.id).to.be.a('string')
    message.payload = 'modified send snapshot'
    expect(vm.draft.payload).to.equal('unsent')
    expect(vm.draft).not.to.have.property('id')
    expect(vm.draft).not.to.have.property('createAt')
  })

  it('does not clear or publish on another connection after a delayed confirmation', async () => {
    const vm = wrapper.vm as any
    let confirm: (value: boolean) => void = () => {}
    vm.$confirm = () =>
      new Promise((resolve) => {
        confirm = resolve
      })
    vm.onClearRetainedMsgPublish()
    route.params.id = 'draft-b'
    await Vue.nextTick()
    confirm(true)
    await settle()
    expect(vm.draft).to.deep.equal(getDefaultPublishDraft())
    expect(wrapper.emitted('handleSend')).to.be.undefined
  })
})
