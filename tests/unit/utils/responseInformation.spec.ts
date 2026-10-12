import { expect } from 'chai'
import { EventEmitter } from 'events'
import mqtt from 'mqtt'
import { createClient, getDefaultRecord } from '@/utils/mqttUtils'

describe('MQTT client message cleanup', () => {
  let originalConnect: typeof mqtt.connect
  beforeEach(() => {
    originalConnect = mqtt.connect
    mqtt.connect = (() => new EventEmitter()) as any
  })
  afterEach(() => {
    mqtt.connect = originalConnect
  })

  it('preserves the close-listener count used by the existing message cleanup guard', async () => {
    mqtt.connect = (() => {
      const client = new EventEmitter()
      client.on('close', () => {})
      return client
    }) as any
    const { curConnectClient: client } = await createClient(getDefaultRecord())
    expect(client.listenerCount('close')).to.equal(1)
  })
})
