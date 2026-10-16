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

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(ElementUI)
localVue.use(VueRouter)
const settle = () => new Promise((resolve) => setTimeout(resolve))

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
      store: new Vuex.Store({ getters: { currentTheme: () => 'light' } }),
      propsData: { editorHeight: 180, clientConnected: true },
      router,
      mocks: {
        $t: (key: string) => key,
        $tc: (key: string) => key,
        $message: { error: (message: string) => errors.push(message) },
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
})
