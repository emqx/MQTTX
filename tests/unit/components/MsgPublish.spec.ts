import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils'
import { Container } from 'typedi'
import MsgPublish from '@/components/MsgPublish.vue'
import ConnectionService from '@/database/services/ConnectionService'
import HistoryMessagePayloadService from '@/database/services/HistoryMessagePayloaderService'
import HistoryMessageHeaderService from '@/database/services/HistoryMessageHeaderService'
import connections from '@/lang/connections'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(ElementUI)
localVue.use(VueRouter)
const settle = () => new Promise((resolve) => setTimeout(resolve))
const translate = (key: string, values: Record<string, string> = {}) => {
  const message = connections[key.replace('connections.', '') as keyof typeof connections]?.en || key
  return message.replace(/\{(\w+)\}/g, (_, name) => values[name])
}

describe('MsgPublish per-connection input', () => {
  const originalGet = Container.get
  let router: VueRouter
  let savedMessages: Record<string, PushMessageModel>
  let payloads: HistoryMessagePayloadModel[]
  let headers: HistoryMessageHeaderModel[]
  let errors: string[]
  let wrapper: Wrapper<Vue>
  let vm: any

  const mount = async () => {
    wrapper = shallowMount(MsgPublish, {
      localVue,
      stubs: { Editor: { template: '<div />', methods: { editorLayout: () => undefined } } },
      store: new Vuex.Store({
        getters: { currentTheme: () => 'light', batchMaxItems: () => 100, batchMaxBytes: () => 65536 },
      }),
      propsData: { editorHeight: 180, clientConnected: true },
      router,
      mocks: {
        $t: (key: string) => key,
        $tc: (key: string) => key,
        $confirm: () => Promise.resolve(),
        $message: {
          error: (message: string) => errors.push(message),
          warning: (message: string) => errors.push(message),
        },
      },
    })
    vm = wrapper.vm
    await settle()
  }

  const switchTo = async (id: string) => {
    await router.push(`/recent_connections/${id}`)
    await settle()
  }

  beforeEach(async () => {
    savedMessages = {}
    payloads = []
    headers = []
    errors = []
    const byConnection =
      <T extends { connectionId?: string }>(list: T[]) =>
      async (id: string) =>
        list.filter(({ connectionId }) => connectionId === id)
    ;(Container as any).get = (type: unknown) => {
      if (type === ConnectionService) {
        return {
          getPushMessage: async (id: string) => savedMessages[id] && { ...savedMessages[id] },
          updatePushMessage: async (id: string, message: PushMessageModel) => (savedMessages[id] = { ...message }),
          getPushProp: async () => undefined,
        }
      }
      if (type === HistoryMessagePayloadService) return { getAll: byConnection(payloads) }
      if (type === HistoryMessageHeaderService) return { getAll: byConnection(headers) }
      return {}
    }
    // A real router, because another spec installs VueRouter globally and $route cannot be mocked.
    router = new VueRouter({ routes: [{ path: '/recent_connections/:id', component: { render: (h) => h('div') } }] })
    await router.push('/recent_connections/a')
    await mount()
  })

  afterEach(() => {
    wrapper.destroy()
    Container.get = originalGet
  })

  it('keeps each connection input across switches and remounts', async () => {
    Object.assign(vm.msgRecord, {
      payload: 'typed in A',
      topic: 'a/topic',
      qos: 2,
      retain: true,
      payloadType: 'Plaintext',
    })
    const inputA = { ...vm.msgRecord }
    await switchTo('b')
    expect(vm.msgRecord.payload).to.equal(JSON.stringify({ msg: 'hello' }, null, 2))
    vm.msgRecord.payload = 'typed in B'
    await switchTo('a')
    expect(vm.msgRecord).to.deep.equal(inputA)
    wrapper.destroy()
    await router.push('/recent_connections/b')
    await mount()
    expect(vm.msgRecord.payload).to.equal('typed in B')
  })

  it('opens a connection with its own latest sent message and history', async () => {
    payloads.push(
      { connectionId: 'a', payload: 'sent by A', payloadType: 'Plaintext' },
      { connectionId: 'b', payload: 'SGVsbG8=', payloadType: 'Base64' },
    )
    headers.push({ connectionId: 'b', topic: 'b/topic', qos: 1, retain: true })
    await switchTo('b')
    expect(vm.msgRecord).to.deep.equal({
      topic: 'b/topic',
      batch: false,
      qos: 1,
      retain: true,
      payload: 'SGVsbG8=',
      payloadType: 'Base64',
    })
    expect(vm.payloadsHistory).to.have.length(1)
    expect(vm.historyIndex).to.equal(0)
    expect(savedMessages).to.deep.equal({})
  })

  it('restores history text and format without converting it', async () => {
    payloads.push(
      { connectionId: 'a', payload: 'SGVsbG8=', payloadType: 'Base64' },
      { connectionId: 'a', payload: '41 42', payloadType: 'Hex' },
    )
    await vm.loadHistoryData()
    vm.decrease()
    expect(vm.msgRecord).to.include({ payload: '41 42', payloadType: 'Hex' })
    vm.decrease()
    expect(vm.msgRecord).to.include({ payload: 'SGVsbG8=', payloadType: 'Base64' })
    expect(vm.historyIndex).to.equal(0)
  })

  it('converts the payload only when the user changes its format', async () => {
    vm.msgRecord.payload = 'hello'
    vm.msgRecord.payloadType = 'Plaintext'
    await vm.handleTypeChange('Base64')
    expect(vm.msgRecord).to.include({ payload: 'aGVsbG8=', payloadType: 'Base64' })
    vm.msgRecord.payload = 'not JSON'
    await vm.handleTypeChange('JSON')
    expect(vm.msgRecord).to.include({ payload: 'not JSON', payloadType: 'Base64' })
    expect(errors).to.have.length(1)
  })

  it('sends a snapshot and points history at the sent payload', async () => {
    Object.assign(vm.msgRecord, { topic: 'request', payload: 'typed', payloadType: 'Plaintext' })
    await vm.send()
    const [message, payloadType, afterSend] = wrapper.emitted('handleSend')![0]
    expect(message).to.include({ topic: 'request', payload: 'typed', out: true })
    expect(message).not.to.have.property('payloadType')
    expect(payloadType).to.equal('Plaintext')
    vm.msgRecord.payload = 'next edit'
    expect(message.payload).to.equal('typed')
    payloads.push({ connectionId: 'a', payload: 'typed', payloadType: 'Plaintext' })
    await afterSend()
    expect(vm.historyIndex).to.equal(0)
  })
  it('restores the batch flag from header history, including ordinary history', () => {
    vm.handleHeaderChange({ topic: 'batch', qos: 1, retain: false, batch: true })
    expect(vm.msgRecord.batch).to.equal(true)
    vm.handleHeaderChange({ topic: 'ordinary', qos: 1, retain: false })
    expect(vm.msgRecord.batch).to.equal(false)
  })

  it('preserves incompatible history settings and blocks sending instead of silently changing them', async () => {
    await wrapper.setProps({ mqttVersion: '3.1.1' })
    Object.assign(vm.msgRecord, { payloadType: 'Plaintext', payload: 'valid' })
    vm.MQTT5PropsForm = { payloadFormatIndicator: true }
    vm.MQTT5PropsSend = { payloadFormatIndicator: true }
    vm.handleHeaderChange({ topic: 'demo', qos: 2, retain: true, batch: true })
    await Vue.nextTick()
    expect(vm.msgRecord).to.include({ qos: 2, retain: true, batch: true })
    expect(vm.MQTT5PropsForm.payloadFormatIndicator).to.equal(true)
    expect(vm.MQTT5PropsSend.payloadFormatIndicator).to.equal(true)
    expect(vm.batchState.error).to.equal('UNSUPPORTED_BATCH_QOS')
    await vm.send()
    expect(wrapper.emitted('handleSend')).to.equal(undefined)
    expect(errors).to.deep.equal([])
    await wrapper.setProps({ mqttVersion: '3.1' })
    expect(vm.msgRecord.batch).to.equal(false)
  })

  it('preserves saved batch settings across a protocol change and blocks incompatible Retain', async () => {
    savedMessages.b = { topic: 'demo', qos: 1, retain: true, batch: true, payload: 'valid', payloadType: 'Plaintext' }
    await switchTo('b')
    expect(vm.msgRecord).to.deep.equal(savedMessages.b)
    await wrapper.setProps({ mqttVersion: '3.1.1' })
    expect(vm.msgRecord.retain).to.equal(true)
    expect(vm.batchRetainDisabled).to.equal(true)
    expect(vm.batchQosOptions).to.deep.equal([0, 1])
    expect(vm.batchState.error).to.equal('INVALID_BATCH_METADATA')
    await vm.send()
    expect(wrapper.emitted('handleSend')).to.equal(undefined)
  })

  it('keeps line input unchanged when choosing a batch payload type and blocks invalid sends', async () => {
    Object.assign(vm.msgRecord, { batch: true, topic: 'demo', payload: '41\ninvalid', payloadType: 'Plaintext' })
    await vm.handleTypeChange('Hex')
    expect(vm.msgRecord.payload).to.equal('41\ninvalid')
    expect(vm.batchState.error).to.equal('BATCH_LINE_ERROR')
    await vm.send()
    expect(wrapper.emitted('handleSend')).to.equal(undefined)
    vm.msgRecord.payload = '41\n42'
    await vm.send()
    expect(wrapper.emitted('handleSend')![0][0]).to.include({ batch: true, payload: '41\n42' })
  })

  it('clears a retained property-carrier batch with an ordinary unmarked empty publication', async () => {
    await wrapper.setProps({ mqttVersion: '5.0', mqtt5PropsEnable: true })
    Object.assign(vm.msgRecord, { batch: true, topic: 'demo', payload: 'one\ntwo', payloadType: 'Plaintext' })
    vm.MQTT5PropsSend = { userProperties: { 'batch-format': 'v1', 'batch-size': '2', other: 'kept' } }
    vm.onClearRetainedMsgPublish()
    await settle()
    const sent = wrapper.emitted('handleSend')![0][0]
    expect(sent).to.include({ batch: false, retain: true, payload: '', topic: 'demo' })
    expect(sent.properties.userProperties).to.deep.equal({ other: 'kept' })
    expect(vm.msgRecord).to.include({ payload: '', retain: true })
  })
  it('uses localized publish reasons for the status line, including the actual limit', async () => {
    vm.$t = (key: string, values: Record<string, number> = {}) => `${key} ${JSON.stringify(values)}`
    Object.assign(vm.msgRecord, { batch: true, topic: 'demo', payload: '\n'.repeat(120), payloadType: 'Plaintext' })
    expect(vm.batchError).to.equal('connections.batchItemsLimit {"count":120,"max":100}')
    vm.msgRecord.payload = 'x'.repeat(69998)
    expect(vm.batchError).to.equal('connections.batchBytesLimit {"bytes":70000,"max":65536}')
    vm.msgRecord.payload = 'valid'
    vm.msgRecord.topic = 'a+b'
    expect(vm.batchError).to.include('connections.batchInvalidTopic')
    vm.msgRecord.topic = 'demo'
    await wrapper.setProps({ mqtt5PropsEnable: true })
    vm.MQTT5PropsSend = { userProperties: { 'batch-size': '1' } }
    expect(vm.batchError).to.include('connections.batchMarkerConflict')
    vm.MQTT5PropsSend = { payloadFormatIndicator: true }
    expect(vm.batchError).to.include('connections.batchInvalidMetadata')
  })

  it('enables batch for Plaintext and Hex without a confirmation dialog', async () => {
    Object.assign(vm.msgRecord, { qos: 1, retain: true })
    vm.MQTT5PropsForm = { payloadFormatIndicator: false }
    vm.MQTT5PropsSend = { payloadFormatIndicator: false }
    let dialogs = 0
    vm.$confirm = () => {
      dialogs++
      return Promise.resolve()
    }
    for (const payloadType of ['Plaintext', 'Hex']) {
      vm.msgRecord.payloadType = payloadType
      wrapper.find('.batch-checkbox').vm.$emit('change', true)
      await settle()
      expect(vm.msgRecord).to.include({ batch: true, payloadType, qos: 1, retain: true })
      wrapper.find('.batch-checkbox').vm.$emit('change', false)
      await settle()
      expect(vm.msgRecord.batch).to.equal(false)
    }
    expect(dialogs).to.equal(0)
  })

  it('confirms JSON and QoS changes together before applying them and enabling batch', async () => {
    let confirm!: () => void
    const dialogs: string[] = []
    vm.$t = translate
    vm.$confirm = (message: string) => {
      dialogs.push(message)
      return new Promise<void>((resolve) => (confirm = resolve))
    }
    const payload = '{"a":1}\n{"a":2}'
    Object.assign(vm.msgRecord, { payload, payloadType: 'JSON', qos: 2 })
    wrapper.find('.batch-checkbox').vm.$emit('change', true)
    expect(dialogs).to.deep.equal(['Enabling Batch changes: JSON → Plaintext, QoS 2 → 1. Continue?'])
    expect(vm.msgRecord).to.include({ batch: false, payloadType: 'JSON', payload, qos: 2 })
    confirm()
    await settle()
    expect(vm.msgRecord).to.include({ batch: true, payloadType: 'Plaintext', payload, qos: 1 })
    expect(errors).to.deep.equal([])
  })

  it('keeps batch off and preserves every setting when its confirmation is canceled', async () => {
    await wrapper.setProps({ mqttVersion: '3.1.1' })
    vm.$confirm = () => Promise.reject('cancel')
    const payload = '{"a":1}\n{"a":2}'
    Object.assign(vm.msgRecord, { payload, payloadType: 'JSON', qos: 2, retain: true })
    vm.MQTT5PropsForm = { payloadFormatIndicator: true }
    vm.MQTT5PropsSend = { payloadFormatIndicator: true }
    wrapper.find('.batch-checkbox').vm.$emit('change', true)
    await settle()
    expect(vm.msgRecord).to.include({ batch: false, payloadType: 'JSON', payload, qos: 2, retain: true })
    expect(vm.MQTT5PropsForm.payloadFormatIndicator).to.equal(true)
    expect(vm.MQTT5PropsSend.payloadFormatIndicator).to.equal(true)
  })

  it('lists and confirms turning Retain off for MQTT 3.1.1', async () => {
    await wrapper.setProps({ mqttVersion: '3.1.1' })
    Object.assign(vm.msgRecord, { payloadType: 'Plaintext', retain: true })
    const dialogs: string[] = []
    vm.$t = translate
    vm.$confirm = (message: string) => {
      dialogs.push(message)
      return Promise.resolve()
    }
    wrapper.find('.batch-checkbox').vm.$emit('change', true)
    await settle()
    expect(dialogs).to.deep.equal(['Enabling Batch changes: Retain off. Continue?'])
    expect(vm.msgRecord).to.include({ batch: true, retain: false })
  })

  it('lists PFI once when either property record is true and clears both after confirmation', async () => {
    vm.msgRecord.payloadType = 'Plaintext'
    const dialogs: string[] = []
    vm.$t = translate
    vm.$confirm = (message: string) => {
      dialogs.push(message)
      return Promise.resolve()
    }
    for (const source of ['MQTT5PropsForm', 'MQTT5PropsSend']) {
      vm.MQTT5PropsForm = {}
      vm.MQTT5PropsSend = {}
      vm[source] = { payloadFormatIndicator: true }
      wrapper.find('.batch-checkbox').vm.$emit('change', true)
      await settle()
      expect(dialogs[dialogs.length - 1]).to.equal('Enabling Batch changes: Payload Format Indicator off. Continue?')
      expect(vm.msgRecord.batch).to.equal(true)
      expect(vm.MQTT5PropsForm.payloadFormatIndicator).to.equal(false)
      expect(vm.MQTT5PropsSend.payloadFormatIndicator).to.equal(false)
      wrapper.find('.batch-checkbox').vm.$emit('change', false)
      await settle()
    }
    expect(dialogs).to.have.length(2)
  })
})
