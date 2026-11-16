import '../mocks/browserStorage'
import { assert } from 'chai'
import ConnectionForm from '@/views/connections/ConnectionForm.vue'
import { getDefaultRecord } from '@/utils/mqttUtils'

interface FormFixture {
  oper: 'create'
  record: ConnectionModel
  defaultRecord: ConnectionModel
  $route: { params: { id: string }; query: { cloudConnection?: string } }
  $message: { error: (message: string) => void }
  $t: (key: string) => string
  handleDefaultCollectionChange: () => void
  handleProtocol: (protocol: Protocol) => void
  handleSSL: (enabled: boolean) => void
  changeProtocol: (protocol: Protocol | undefined, enabled: boolean) => void | boolean
}
const methods = (
  ConnectionForm as unknown as {
    options: {
      methods: Pick<FormFixture, 'handleProtocol' | 'handleSSL' | 'changeProtocol'> & {
        initRecord: (this: FormFixture) => Promise<void>
      }
    }
  }
).options.methods

describe('Cloud connection form prefill', () => {
  for (const protocol of ['mqtt', 'mqtts', 'ws', 'wss'] as Protocol[]) {
    it(`opens a fresh ${protocol} draft without credentials or saving`, async () => {
      const defaults = getDefaultRecord()
      const form: FormFixture = {
        oper: 'create',
        record: defaults,
        defaultRecord: defaults,
        $route: {
          params: { id: '0' },
          query: {
            cloudConnection: JSON.stringify({
              name: 'Cloud deployment',
              host: 'broker.example.com',
              port: 12345,
              protocol,
              username: 'must-not-be-used',
              password: 'must-not-be-used',
              rejectUnauthorized: false,
            }),
          },
        },
        $message: { error: () => assert.fail('Valid preset rejected') },
        $t: (key) => key,
        handleDefaultCollectionChange: () => {},
        handleProtocol: methods.handleProtocol,
        handleSSL: methods.handleSSL,
        changeProtocol: methods.changeProtocol,
      }
      await methods.initRecord.call(form)
      assert.strictEqual(form.record.name, 'Cloud deployment')
      assert.strictEqual(form.record.host, 'broker.example.com')
      assert.strictEqual(form.record.port, 12345)
      assert.strictEqual(form.record.protocol, protocol)
      assert.strictEqual(form.record.ssl, ['mqtts', 'wss'].includes(protocol))
      assert.strictEqual(form.record.certType, form.record.ssl ? 'server' : '')
      assert.strictEqual(form.record.rejectUnauthorized, true)
      assert.strictEqual(form.record.username, '')
      assert.strictEqual(form.record.password, '')
      assert.strictEqual(form.record.path, '/mqtt')
      assert.isUndefined(form.record.id)
      assert.notStrictEqual(form.record, defaults)
    })
  }
  it('keeps normal defaults and reports a malformed route preset', async () => {
    const defaults = getDefaultRecord()
    let reported = false
    const form: FormFixture = {
      oper: 'create',
      record: defaults,
      defaultRecord: defaults,
      $route: { params: { id: '0' }, query: { cloudConnection: '{' } },
      $message: {
        error: () => {
          reported = true
        },
      },
      $t: (key) => key,
      handleDefaultCollectionChange: () => {},
      handleProtocol: methods.handleProtocol,
      handleSSL: methods.handleSSL,
      changeProtocol: methods.changeProtocol,
    }
    await methods.initRecord.call(form)
    assert.isTrue(reported)
    assert.deepEqual(form.record, defaults)
  })
})
