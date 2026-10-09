import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import { MqttClient, IConnackPacket } from 'mqtt'
import { generate } from 'mqtt-packet'
import { Duplex } from 'stream'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'
import app from '@/store/modules/app'
import { getDefaultRecord } from '@/utils/mqttUtils'

const options = (ConnectionsDetail as any).options

function connack(responseInformation?: string): IConnackPacket {
  return {
    cmd: 'connack',
    sessionPresent: false,
    reasonCode: 0,
    properties: responseInformation === undefined ? undefined : { responseInformation },
  }
}

function createMemoryClient() {
  let stream: Duplex
  const client = new MqttClient(
    () => {
      stream = new Duplex({
        read() {},
        write(_chunk, _encoding, callback) {
          callback()
        },
      })
      return stream
    },
    { clientId: 'response-info-unit-test', protocolVersion: 5, keepalive: 0, reconnectPeriod: 0 },
  )
  return {
    client,
    async connect(responseInformation?: string) {
      const connected = new Promise<void>((resolve) => client.once('connect', () => resolve()))
      stream.push(generate(connack(responseInformation), { protocolVersion: 5 }))
      await connected
      await Vue.nextTick()
    },
    async close() {
      const closed = new Promise<void>((resolve) => client.once('close', () => resolve()))
      stream.destroy()
      await closed
      await Vue.nextTick()
    },
    end() {
      return new Promise<void>((resolve) => client.end(true, {}, () => resolve()))
    },
  }
}

function createContext(client: Partial<MqttClient> = { connected: true }) {
  const state = Vue.observable({ ...app.state, activeConnection: {} } as App)
  return Vue.observable({
    client,
    record: { ...getDefaultRecord(), mqttVersion: '5.0' },
    curConnectionId: 'A',
    activeConnection: state.activeConnection,
    connectLoading: true,
    changeActiveConnection(payload: Client) {
      app.mutations.CHANGE_ACTIVE_CONNECTION(state, payload)
    },
    $notify: () => {},
    $tc: (key: string) => key,
    setShowClientInfo: () => {},
    $emit: () => {},
    $log: { info: () => {} },
  })
}

describe('Desktop CONNACK response information', () => {
  let originalAsync: boolean

  beforeEach(() => {
    originalAsync = Vue.config.async
    Vue.config.async = true
  })

  afterEach(() => {
    Vue.config.async = originalAsync
  })

  it('uses the existing connect callback and updates reactively through disconnects and reconnects', async () => {
    const session = createMemoryClient()
    const context = createContext(session.client)
    const view = new Vue({
      computed: {
        responseInformation: () => options.computed.responseInformation.get.call(context),
      },
    }) as Vue & { responseInformation: string }
    const displayedValues: string[] = []
    view.$watch('responseInformation', (value: string) => displayedValues.push(value))
    session.client.on('connect', (packet) => options.methods.onConnect.call(context, packet))
    const connectListenerCount = session.client.listenerCount('connect')
    const closeListenerCount = session.client.listenerCount('close')
    try {
      expect(view.responseInformation).to.equal('')
      await session.connect('responses/first')
      expect(view.responseInformation).to.equal('responses/first')
      await session.close()
      expect(view.responseInformation).to.equal('')
      session.client.reconnect()
      await session.connect('responses/reconnected')
      expect(view.responseInformation).to.equal('responses/reconnected')
      await session.close()
      session.client.reconnect()
      await session.connect()
      expect(view.responseInformation).to.equal('')
      expect(context.activeConnection.A.responseInformation).to.equal('')
      expect(displayedValues).to.deep.equal(['responses/first', '', 'responses/reconnected', ''])
      expect(session.client.listenerCount('connect')).to.equal(connectListenerCount)
      expect(session.client.listenerCount('close')).to.equal(closeListenerCount)
    } finally {
      view.$destroy()
      await session.end()
    }
  })

  it('ignores response information on MQTT 3 connections and disconnected clients', () => {
    const context = createContext()
    context.record.mqttVersion = '3.1.1'
    options.methods.onConnect.call(context, connack('unexpected'))
    expect(context.activeConnection.A.responseInformation).to.equal('')
    expect(options.computed.responseInformation.get.call(context)).to.equal('')
    context.record.mqttVersion = '5.0'
    options.methods.onConnect.call(context, connack('responses/A'))
    expect(options.computed.responseInformation.get.call(context)).to.equal('responses/A')
    context.client.connected = false
    expect(options.computed.responseInformation.get.call(context)).to.equal('')
  })

  it('keeps each connection response when switching pages or updating message listeners', () => {
    const context = createContext()
    options.methods.onConnect.call(context, connack('responses/A'))
    const connection = context.activeConnection.A
    const subscriptions: SubscriptionModel[] = []
    Vue.set(connection, 'subscriptions', subscriptions)
    context.curConnectionId = 'B'
    context.client = { connected: true }
    options.methods.onConnect.call(context, connack('responses/B'))
    expect(options.computed.responseInformation.get.call(context)).to.equal('responses/B')
    context.curConnectionId = 'A'
    context.client = context.activeConnection.A.client
    context.changeActiveConnection({ id: 'A', client: context.client })
    expect(context.activeConnection.A).to.equal(connection)
    expect(context.activeConnection.A.subscriptions).to.equal(subscriptions)
    expect(options.computed.responseInformation.get.call(context)).to.equal('responses/A')
    options.methods.onConnect.call(context, connack())
    expect(options.computed.responseInformation.get.call(context)).to.equal('')
    expect(context.activeConnection.B.responseInformation).to.equal('responses/B')
  })
})
