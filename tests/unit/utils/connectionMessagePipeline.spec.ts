import { expect } from 'chai'
import { EventEmitter } from 'events'
import { bindMessagePipeline, tearDownMessagePipeline } from '@/utils/connectionMessagePipeline'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'

/**
 * The MQTT client outlives the connection page, so messages received while another page is open must
 * still be processed and saved. The page instead replaces the previous pipeline when it binds, which
 * keeps exactly one message listener on the client (the reason 4605342d added the old removal).
 */
describe('connection message pipeline', () => {
  it('keeps exactly one message listener when the page rebinds the client', () => {
    const client = new EventEmitter()
    const received: string[] = []

    const bindPage = (page: string) => {
      bindMessagePipeline(client as any, () => client.removeAllListeners('message'))
      client.on('message', () => received.push(page))
    }

    bindPage('first')
    expect(client.listenerCount('message')).to.equal(1)

    // Leaving the page keeps the pipeline, so incoming messages are still processed
    client.emit('message')
    expect(received).to.deep.equal(['first'])

    // The next page instance replaces the previous pipeline instead of stacking a second one
    bindPage('second')
    expect(client.listenerCount('message')).to.equal(1)
    client.emit('message')
    expect(received).to.deep.equal(['first', 'second'])
  })

  it('removes the listener when the connection is stopped or deleted', () => {
    const client = new EventEmitter()
    bindMessagePipeline(client as any, () => client.removeAllListeners('message'))
    client.on('message', () => undefined)

    tearDownMessagePipeline(client as any)
    expect(client.listenerCount('message')).to.equal(0)
    expect(() => tearDownMessagePipeline(client as any)).to.not.throw()
  })

  it('rebinds a connected client to the page that is mounted', () => {
    const methods = (ConnectionsDetail as any).options.methods
    const client = new EventEmitter() as any
    client.connected = true
    const received: string[] = []

    const contextFor = (page: string) => ({
      activeConnection: { c1: { client } },
      changeActiveConnection: () => undefined,
      // Mirrors the contract of the real onMessageArrived: bind the pipeline, then listen
      onMessageArrived: (bound: any) => {
        bindMessagePipeline(bound, () => bound.removeAllListeners('message'))
        bound.on('message', () => received.push(page))
      },
    })

    methods.setClientsMessageListener.call(contextFor('first'))
    methods.setClientsMessageListener.call(contextFor('second'))

    expect(client.listenerCount('message')).to.equal(1)
    client.emit('message')
    expect(received).to.deep.equal(['second'])
  })
})
