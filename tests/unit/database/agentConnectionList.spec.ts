import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection } from 'typeorm'
import ConnectionService from '@/database/services/ConnectionService'
import ConnectionEntity from '@/database/models/ConnectionEntity'
import CollectionEntity from '@/database/models/CollectionEntity'
import HistoryConnectionEntity from '@/database/models/HistoryConnectionEntity'
import HistoryMessagePayloadEntity from '@/database/models/HistoryMessagePayloadEntity'
import HistoryMessageHeaderEntity from '@/database/models/HistoryMessageHeaderEntity'
import WillEntity from '@/database/models/WillEntity'
import MessageEntity from '@/database/models/MessageEntity'
import SubscriptionEntity from '@/database/models/SubscriptionEntity'
import { getDefaultRecord } from '@/utils/mqttUtils'
import { createConnectionTools } from '@/utils/ai/agent/tools/connections'
import { AgentToolDeps } from '@/utils/ai/agent/tools/types'

describe('Agent connection list (SQLite)', () => {
  let database: Connection
  let connectionService: ConnectionService

  before(async () => {
    database = await createConnection({
      name: 'agent-connection-list-test',
      type: 'sqlite',
      database: ':memory:',
      entities: [
        ConnectionEntity,
        CollectionEntity,
        HistoryConnectionEntity,
        HistoryMessagePayloadEntity,
        HistoryMessageHeaderEntity,
        WillEntity,
        MessageEntity,
        SubscriptionEntity,
      ],
      synchronize: true,
    })
    connectionService = new ConnectionService(
      database.getRepository(ConnectionEntity),
      database.getRepository(HistoryConnectionEntity),
      database.getRepository(WillEntity),
    )
  })

  after(async () => {
    if (database?.isConnected) await database.close()
  })

  it('counts persisted subscriptions per connection, including disabled subscriptions and empty connections', async () => {
    const subscribed = (await connectionService.create({ ...getDefaultRecord(), name: 'Subscribed' }))!
    const other = (await connectionService.create({ ...getDefaultRecord(), name: 'Other' }))!
    const empty = (await connectionService.create({ ...getDefaultRecord(), name: 'Empty' }))!
    await database.getRepository(SubscriptionEntity).save([
      { connectionId: subscribed.id, topic: 'plant/#', qos: 0, disabled: false },
      { connectionId: subscribed.id, topic: 'disabled/#', qos: 1, disabled: true },
      { connectionId: other.id, topic: 'other/#', qos: 0, disabled: false },
    ])

    const deps = {
      services: { connectionService, collectionService: { getAll: async () => [] } },
      store: { getters: {} },
    } as unknown as AgentToolDeps
    const result: any = await createConnectionTools(deps).list_connections.execute!({}, {} as any)

    expect(
      Object.fromEntries(result.connections.map(({ id, subscriptionCount }: any) => [id, subscriptionCount])),
    ).to.deep.equal({ [subscribed.id!]: 2, [other.id!]: 1, [empty.id!]: 0 })
  })
})
