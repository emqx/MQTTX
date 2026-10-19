import { expect } from 'chai'
import Vue from 'vue'
import { EventEmitter } from 'events'
import { ConnectionView, ConnectionBridge, ConnectionBridgeRouter } from '@/utils/ai/agent/connectionBridge'

type FakeClient = EventEmitter & { connected: boolean }

describe('ConnectionBridge', () => {
  let bridge: ConnectionBridge
  let route: ConnectionBridgeRouter['currentRoute']
  let router: ConnectionBridgeRouter
  let connectionExists: (id: string) => Promise<boolean>

  const createClient = (): FakeClient => {
    const client = new EventEmitter() as FakeClient
    client.connected = false
    return client
  }

  const createView = (id: string, client: FakeClient, overrides: Partial<ConnectionView> = {}): ConnectionView =>
    ({
      connectionId: id,
      record: { id, name: `Connection ${id}` } as unknown as ConnectionModel,
      getClient: () => client,
      isConnecting: () => false,
      connect: async () => undefined,
      cancelConnect: () => undefined,
      disconnect: () => undefined,
      subscribe: async () => undefined,
      unsubscribe: async () => true,
      publish: async () => undefined,
      deleteConnection: async () => undefined,
      ...overrides,
    } as ConnectionView)

  beforeEach(() => {
    route = { path: '/recent_connections/c1', query: {}, params: { id: 'c1' } }
    router = {
      currentRoute: route,
      push: async (location: string) => {
        route.path = location
        const match = location.match(/\/recent_connections\/(.+)/)
        route.params = { id: match ? match[1] : '' }
      },
    }
    connectionExists = async () => true
    bridge = new ConnectionBridge()
    bridge.configure({ router, connectionExists })
  })

  describe('open', () => {
    it('should return the current view without navigating', async () => {
      const client = createClient()
      const view = createView('c1', client)
      bridge.register(view)

      expect(await bridge.open('c1')).to.equal(view)
    })

    it('should navigate and wait until the view is registered', async () => {
      const client = createClient()
      const view = createView('c2', client)
      setTimeout(() => bridge.register(view), 30)

      expect(await bridge.open('c2', 1000)).to.equal(view)
      expect(route.params.id).to.equal('c2')
    })

    it('should reject when the view never appears', async () => {
      let error: Error | undefined
      try {
        await bridge.open('missing', 80)
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.contain('Timed out')
    })

    it('should refuse while the user is editing a connection', async () => {
      route.query = { oper: 'edit' }
      let error: Error | undefined
      try {
        await bridge.open('c1')
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.contain('editing')
    })

    it('should refuse a connection that does not exist', async () => {
      connectionExists = async () => false
      bridge.configure({ router, connectionExists })

      let error: Error | undefined
      try {
        await bridge.open('unknown')
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.contain('not found')
    })
  })

  describe('connect', () => {
    it('should resolve when the client emits connect', async () => {
      const client = createClient()
      const view = createView('c1', client, {
        connect: async () => {
          setTimeout(() => {
            client.connected = true
            client.emit('connect')
          }, 5)
        },
      })

      await bridge.connect(view, 500)
      expect(client.connected).to.equal(true)
    })

    it('should reject when the client emits an error', async () => {
      const client = createClient()
      const view = createView('c1', client, {
        connect: async () => {
          setTimeout(() => client.emit('error', new Error('ECONNREFUSED')), 5)
        },
      })

      let error: Error | undefined
      try {
        await bridge.connect(view, 500)
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.equal('ECONNREFUSED')
    })

    it('should cancel the connect attempt on timeout', async () => {
      const client = createClient()
      let cancelled = false
      const view = createView('c1', client, {
        isConnecting: () => true,
        cancelConnect: () => {
          cancelled = true
        },
      })

      let error: Error | undefined
      try {
        await bridge.connect(view, 60)
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.contain('timed out')
      expect(cancelled).to.equal(true)
    })
  })
  describe('current', () => {
    it('should update a computed property that read it before the view registered', () => {
      // The Agent panel reads the current connection in computed properties, often before the page registers
      const vm = new Vue({ computed: { currentId: () => bridge.current()?.connectionId ?? '' } })
      expect((vm as any).currentId).to.equal('')

      const view = createView('c1', createClient())
      bridge.register(view)
      expect((vm as any).currentId).to.equal('c1')

      bridge.unregister(view)
      expect((vm as any).currentId).to.equal('')
      vm.$destroy()
    })
  })
})
