import '../mocks/browserStorage'
import { expect } from 'chai'
import zlib from 'zlib'
import Vuex from 'vuex'
import ElementUI from 'element-ui'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'
import MsgLeftItem from '@/components/MsgLeftItem.vue'

const methods = (ConnectionsDetail as any).options.methods
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(ElementUI)

function receive(payload: Buffer, decompressGzip = true) {
  return methods.processReceivedMessage.call(
    { ...methods, decompressGzip, receivedMsgType: 'Plaintext', scriptOption: null },
    'test/gzip',
    payload,
    { qos: 0, retain: false },
  ) as MessageModel
}

function render(message: MessageModel) {
  return shallowMount(MsgLeftItem, {
    localVue,
    store: new Vuex.Store({ getters: { jsonHighlight: () => false, currentTheme: () => 'light' } }),
    propsData: { ...message, msgId: message.id },
    mocks: { $t: (key: string) => key },
  })
}

describe('Received GZIP indicator', () => {
  it('marks a successfully decompressed message and shows the badge from saved metadata', () => {
    const message = receive(zlib.gzipSync(Buffer.from('hello')))
    expect(message.payload).to.equal('hello')
    expect(JSON.parse(message.meta!)).to.include({ gzipDecompressed: true, msgType: 'Plaintext' })

    const wrapper = render(JSON.parse(JSON.stringify(message)))
    expect(wrapper.find('.gzip-tag').text()).to.equal('GZIP')
    expect(wrapper.find('.gzip-tag').attributes('title')).to.equal('connections.gzipDecompressed')
    wrapper.destroy()
  })

  it('does not mark ordinary, corrupted, or disabled GZIP messages', () => {
    const corrupted = Buffer.from([0x1f, 0x8b, 0x00, 0x01])
    const messages = [
      receive(Buffer.from('hello')),
      receive(Buffer.alloc(0)),
      receive(corrupted),
      receive(zlib.gzipSync(Buffer.from('hello')), false),
      { ...receive(Buffer.from('legacy message')), meta: undefined },
    ]
    expect(messages[2].payload).to.equal(corrupted.toString())
    expect(JSON.parse(messages[2].meta!).msgError).to.be.a('string')
    for (const message of messages) {
      expect(JSON.parse(message.meta || '{}')).not.to.have.property('gzipDecompressed')
      const wrapper = render(message)
      expect(wrapper.find('.gzip-tag').exists()).to.equal(false)
      wrapper.destroy()
    }
  })
})
