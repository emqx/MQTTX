import '../mocks/browserStorage'
import { expect } from 'chai'
import { MqttClient } from 'mqtt'
import { Duplex } from 'stream'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'
import Connections from '@/views/connections/index.vue'
import { getDefaultRecord } from '@/utils/mqttUtils'

const detailOptions = (ConnectionsDetail as any).options
const connectionsOptions = (Connections as any).options

function createMemoryClient(): MqttClient {
  return new MqttClient(
    () =>
      new Duplex({
        read() {},
        write(_chunk, _encoding, callback) {
          callback()
        },
      }),
    { clientId: 'edit-stops-reconnect-unit-test', keepalive: 0, reconnectPeriod: 0 },
  )
}

function createDetailContext(client: MqttClient) {
  const context: any = {
    client,
    record: {
      ...getDefaultRecord(),
      name: 'Reconnecting',
      host: '127.0.0.1',
      clientId: 'edit-stops-reconnect-unit-test',
    },
    reTryConnectTimes: 2,
    connectLoading: true,
    $log: { warn: () => {}, info: () => {} },
  }
  context.forceStopToReconnect = detailOptions.methods.forceStopToReconnect.bind(context)
  context.forceCloseTheConnection = detailOptions.methods.forceCloseTheConnection.bind(context)
  return context
}

function endClient(client: MqttClient): Promise<void> {
  return new Promise<void>((resolve) => client.end(true, {}, () => resolve()))
}

describe('Desktop editing a connection stops its background reconnect', () => {
  it('stops the reconnecting client when oper changes to edit', async () => {
    const client = createMemoryClient()
    // Simulate a client that failed to connect and keeps auto-reconnecting with a stale config
    client.connected = false
    client.reconnecting = true
    const detailContext = createDetailContext(client)
    const ended = new Promise<void>((resolve) => client.once('end', () => resolve()))

    connectionsOptions.methods.handleOperChange.call({ $refs: { connectionsDetail: detailContext } }, 'edit')

    expect(client.disconnecting).to.equal(true)
    expect(client.reconnecting).to.equal(false)
    await ended
    expect(detailContext.connectLoading).to.equal(false)
    expect(detailContext.reTryConnectTimes).to.equal(0)
  })

  it('does not stop the client when oper changes to create', async () => {
    const client = createMemoryClient()
    client.connected = false
    client.reconnecting = true
    const detailContext = createDetailContext(client)

    connectionsOptions.methods.handleOperChange.call({ $refs: { connectionsDetail: detailContext } }, 'create')

    expect(client.disconnecting).to.equal(false)
    expect(client.reconnecting).to.equal(true)

    await endClient(client)
  })
})
