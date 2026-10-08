import { expect } from 'chai'
import { EventEmitter } from 'events'
import mqtt from 'mqtt'
import { createClient, getDefaultRecord } from '@/utils/mqttUtils'

// Simulate each MQTT.js client independently, including background reconnects.
describe('Desktop response information lifecycle', () => {
  let originalConnect: typeof mqtt.connect
  beforeEach(() => {
    originalConnect = mqtt.connect
    mqtt.connect = (() => new EventEmitter()) as any
  })
  afterEach(() => {
    mqtt.connect = originalConnect
  })

  it('replaces and clears information for each successful CONNACK and close', async () => {
    const record = { ...getDefaultRecord(), mqttVersion: '5.0' }
    const { curConnectClient: client } = await createClient(record)
    client.emit('connect', { properties: { responseInformation: 'responses/first' } })
    expect(client.responseInformation).to.equal('responses/first')
    client.emit('close')
    expect(client.responseInformation).to.equal('')
    client.emit('connect', { properties: { responseInformation: 'responses/second' } })
    expect(client.responseInformation).to.equal('responses/second')
    client.emit('connect', { properties: {} })
    expect(client.responseInformation).to.equal('')
    client.emit('connect', {})
    expect(client.responseInformation).to.equal('')
    expect(record).not.to.have.property('responseInformation')
  })

  it('isolates connections and replacement clients, including old-client close events', async () => {
    const recordA = { ...getDefaultRecord(), id: 'A', mqttVersion: '5.0' }
    const recordB = { ...getDefaultRecord(), id: 'B', mqttVersion: '5.0' }
    const { curConnectClient: a } = await createClient(recordA)
    const { curConnectClient: b } = await createClient(recordB)
    a.emit('connect', { properties: { responseInformation: 'responses/A' } })
    b.emit('connect', { properties: { responseInformation: 'responses/B' } })
    const { curConnectClient: replacement } = await createClient(recordA)
    replacement.emit('connect', { properties: { responseInformation: 'responses/new-A' } })
    a.emit('close')
    expect(replacement.responseInformation).to.equal('responses/new-A')
    expect(b.responseInformation).to.equal('responses/B')
  })

  it('keeps MQTT 3 clients empty', async () => {
    const { curConnectClient: client } = await createClient({ ...getDefaultRecord(), mqttVersion: '3.1.1' })
    client.emit('connect', { properties: { responseInformation: 'unexpected' } })
    expect(client.responseInformation).to.equal('')
  })
})
