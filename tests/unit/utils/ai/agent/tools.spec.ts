import { expect } from 'chai'
import { EventEmitter } from 'events'
import { createConnectionTools } from '@/utils/ai/agent/tools/connections'
import { createMessagingTools } from '@/utils/ai/agent/tools/messaging'
import { AgentToolDeps } from '@/utils/ai/agent/tools/types'
import { ConnectionView } from '@/utils/ai/agent/connectionBridge'
import { withTimeout } from '@/utils/ai/agent/tools/helpers'

type FakeClient = EventEmitter & { connected: boolean }

describe('MQTT tools', () => {
  const connection = {
    id: 'c1',
    name: 'Local EMQX',
    host: '127.0.0.1',
    port: 1883,
    protocol: 'mqtt',
    path: '/mqtt',
    clientId: 'cid',
    username: 'user',
    password: 'secret',
    mqttVersion: '5.0',
    clean: true,
    keepalive: 60,
    ssl: false,
    rejectUnauthorized: true,
    ca: 'CA',
    cert: 'CERT',
    key: 'KEY',
    subscriptions: [{ topic: 'a/#', qos: 0, disabled: false }],
    will: { lastWillTopic: 'w', lastWillPayload: 'secret payload', lastWillQos: 0, lastWillRetain: false },
    parentId: 'g1',
  } as unknown as ConnectionModel

  let client: FakeClient
  let view: ConnectionView
  let deps: AgentToolDeps
  let createCalls: ConnectionModel[]
  let publishCalls: { topic: string; type: string; properties: unknown }[]
  let disconnectCalls: number
  let deleteCalls: number
  let pushCalls: string[]
  let reloadCalls: number

  const setup = () => {
    client = new EventEmitter() as FakeClient
    client.connected = true
    publishCalls = []
    disconnectCalls = 0
    deleteCalls = 0
    pushCalls = []
    createCalls = []
    reloadCalls = 0

    view = {
      connectionId: 'c1',
      record: connection,
      getClient: () => client,
      isConnecting: () => false,
      connect: async () => undefined,
      cancelConnect: () => undefined,
      disconnect: () => {
        disconnectCalls += 1
        client.connected = false
      },
      subscribe: async () => undefined,
      unsubscribe: async () => true,
      publish: async (message: MessageModel, type: PayloadType) => {
        publishCalls.push({ topic: message.topic, type, properties: message.properties })
      },
      deleteConnection: async () => {
        deleteCalls += 1
      },
      reload: async () => {
        reloadCalls += 1
      },
    } as unknown as ConnectionView

    deps = {
      bridge: {
        current: () => view,
        open: async () => view,
        register: () => undefined,
        unregister: () => undefined,
        configure: () => undefined,
        connect: async () => undefined,
      } as any,
      services: {
        connectionService: {
          getAll: async () => [connection],
          get: async (id: string) => (id === 'c1' ? connection : undefined),
          create: async (data: ConnectionModel) => {
            const created = { ...data, id: 'new-id' }
            createCalls.push(created)
            return created
          },
          update: async (id: string, data: ConnectionModel) => ({ ...data, id }),
        },
        messageService: {
          get: async () => ({
            list: [
              {
                id: 'm1',
                topic: 'a/b',
                payload: 'x'.repeat(2500),
                qos: 0,
                retain: false,
                out: false,
                createAt: '2026-01-01 00:00:00',
              },
            ],
            total: 1,
            publishedTotal: 0,
            receivedTotal: 1,
            limit: 20,
            page: 1,
          }),
        },
        topicNodeService: { deleteTopicNodesForConnection: async () => undefined },
        collectionService: { getAll: async () => [{ id: 'g1', name: 'My Group', children: [], isCollection: true }] },
      } as any,
      store: {
        getters: { activeConnection: { c1: { client: { connected: true }, responseInformation: 'server info' } } },
        dispatch: async () => undefined,
      },
      router: {
        currentRoute: { path: '/recent_connections/c1', query: {}, params: { id: 'c1' } },
        push: async (location: string) => {
          pushCalls.push(location)
        },
      },
      getPermissionMode: () => 'ask',
    }
  }

  beforeEach(setup)

  it('lists connections with state and group name', async () => {
    const tools = createConnectionTools(deps)
    const result: any = await tools.list_connections.execute!({}, {} as any)

    expect(result.connections).to.have.length(1)
    expect(result.connections[0]).to.include({ id: 'c1', name: 'Local EMQX', connected: true, subscriptionCount: 1 })
    expect(result.connections[0].group).to.equal('My Group')
    expect(JSON.stringify(result)).to.not.contain('secret')
  })

  it('masks secrets in get_connection', async () => {
    const tools = createConnectionTools(deps)
    const result: any = await tools.get_connection.execute!({ connectionId: 'c1' }, {} as any)

    expect(result.password).to.equal('***')
    expect(result.ca).to.equal('***')
    expect(result.cert).to.equal('***')
    expect(result.key).to.equal('***')
    expect(result.will).to.include({ hasPayload: true })
    expect(JSON.stringify(result)).to.not.contain('secret payload')
    expect(result.subscriptions).to.deep.equal([{ topic: 'a/#', qos: 0, disabled: false }])
  })

  it('throws for a missing connection', async () => {
    const tools = createConnectionTools(deps)
    let error: Error | undefined
    try {
      await tools.get_connection.execute!({ connectionId: 'nope' }, {} as any)
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('not found')
  })

  it('creates a connection with the default port and a unique name', async () => {
    const tools = createConnectionTools(deps)
    const result: any = await tools.create_connection.execute!(
      { name: 'Local EMQX', host: 'broker.emqx.io' } as any,
      {} as any,
    )

    expect(result.name).to.equal('Local EMQX (2)')
    expect(createCalls[0].port).to.equal(1883)
    expect(createCalls[0].protocol).to.equal('mqtt')
  })

  it('reports reconnectRequired when updating a connected connection', async () => {
    const tools = createConnectionTools(deps)
    const result: any = await tools.update_connection.execute!(
      { connectionId: 'c1', changes: { host: 'example.com' } } as any,
      {} as any,
    )
    expect(result.reconnectRequired).to.equal(true)
  })

  it('reloads the open connection after an update', async () => {
    const tools = createConnectionTools(deps)
    await tools.update_connection.execute!({ connectionId: 'c1', changes: { name: 'Renamed' } } as any, {} as any)
    expect(reloadCalls).to.equal(1)
  })

  it('refuses to publish or subscribe on a disconnected connection', async () => {
    client.connected = false
    const tools = createMessagingTools(deps)

    for (const name of ['publish', 'subscribe']) {
      let error: Error | undefined
      try {
        await tools[name].execute!({ connectionId: 'c1', topic: 'a/b', payload: 'x' } as any, {} as any)
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message, name).to.contain('not connected')
    }
    expect(publishCalls).to.have.length(0)
  })

  it('publishes through the connection view', async () => {
    const tools = createMessagingTools(deps)
    const result: any = await tools.publish.execute!(
      { connectionId: 'c1', topic: 'a/b', payload: '{"x":1}', qos: 1, payloadType: 'JSON' } as any,
      {} as any,
    )
    expect(result).to.deep.equal({ published: true, topic: 'a/b', qos: 1 })
    expect(publishCalls).to.deep.equal([{ topic: 'a/b', type: 'JSON', properties: {} }])
  })

  it('truncates long stored payloads', async () => {
    const tools = createMessagingTools(deps)
    const result: any = await tools.get_messages.execute!({ connectionId: 'c1' } as any, {} as any)
    expect(result.total).to.equal(1)
    expect(result.messages[0].payload).to.have.length(2000)
    expect(result.messages[0].truncated).to.equal(true)
  })

  it('subscribes and verifies the subscription was accepted', async () => {
    let subscribed: any
    view = { ...view, subscribe: async (sub: any) => (subscribed = sub) } as ConnectionView
    deps.bridge.current = () => view
    const tools = createMessagingTools(deps)

    const result: any = await tools.subscribe.execute!({ connectionId: 'c1', topic: 'a/#', qos: 1 } as any, {} as any)
    expect(result).to.deep.equal({ subscribed: true, topic: 'a/#', qos: 1 })
    expect(subscribed.topic).to.equal('a/#')
  })

  it('fails when the broker rejects a subscription', async () => {
    view = { ...view, record: { ...connection, subscriptions: [] } as ConnectionModel } as ConnectionView
    deps.bridge.current = () => view
    const tools = createMessagingTools(deps)

    let error: Error | undefined
    try {
      await tools.subscribe.execute!({ connectionId: 'c1', topic: 'a/#', qos: 1 } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('rejected')
  })

  it('waits for messages, attaching the listener before the first await', async () => {
    const tools = createMessagingTools(deps)
    const pending = tools.wait_for_messages.execute!(
      { connectionId: 'c1', topic: 'a/#', count: 1, timeoutSeconds: 5 } as any,
      {} as any,
    )

    expect(client.listenerCount('message')).to.equal(1)
    client.emit('message', 'other/topic', Buffer.from('drop me'))
    client.emit('message', 'a/b', Buffer.from('hello'))

    const result: any = await pending
    expect(result.timedOut).to.equal(false)
    expect(result.messages).to.have.length(1)
    expect(result.messages[0].payload).to.equal('hello')
    expect(client.listenerCount('message')).to.equal(0)
  })

  it('returns base64 for a payload that is not valid UTF-8', async () => {
    const tools = createMessagingTools(deps)
    const pending = tools.wait_for_messages.execute!({ connectionId: 'c1' } as any, {} as any)
    client.emit('message', 'a/b', Buffer.from([0xff, 0xfe]))
    const result: any = await pending
    expect(result.messages[0].encoding).to.equal('base64')
  })

  it('times out when no message arrives', async () => {
    const tools = createMessagingTools(deps)
    const result: any = await tools.wait_for_messages.execute!(
      { connectionId: 'c1', timeoutSeconds: 1 } as any,
      {} as any,
    )
    expect(result.timedOut).to.equal(true)
    expect(result.messages).to.deep.equal([])
    expect(client.listenerCount('message')).to.equal(0)
  })

  it('refuses to wait when the connection is not open', () => {
    deps.bridge.current = () => null
    const tools = createMessagingTools(deps)
    expect(() => tools.wait_for_messages.execute!({ connectionId: 'c1' } as any, {} as any)).to.throw()
  })

  it('disconnects and deletes through the view', async () => {
    const tools = createConnectionTools(deps)
    const result: any = await tools.delete_connection.execute!({ connectionId: 'c1' } as any, {} as any)

    expect(disconnectCalls).to.equal(1)
    expect(deleteCalls).to.equal(1)
    expect(result).to.deep.equal({ deleted: true, name: 'Local EMQX' })
    expect(pushCalls).to.deep.equal(['/recent_connections'])
  })
})

describe('withTimeout', () => {
  it('rejects with the message when the promise takes too long', async () => {
    let error: Error | undefined
    try {
      await withTimeout(new Promise(() => undefined), 10, 'too slow')
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.equal('too slow')
  })

  it('resolves with the value when the promise settles in time', async () => {
    expect(await withTimeout(Promise.resolve(1), 1000, 'too slow')).to.equal(1)
  })
})
