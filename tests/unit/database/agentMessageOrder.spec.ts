import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, createConnection, EntitySchema, Repository } from 'typeorm'
import AgentMessageService from '@/database/services/AgentMessageService'
import { AgentMessage } from '@/types/agent'

// Exercise the real service against SQLite to prove the tie-breaker used for same-second messages.
const agentMessages = new EntitySchema<AgentMessage>({
  name: 'AgentMessageEntity',
  columns: {
    id: { type: String, primary: true },
    role: { type: String },
    content: { type: String },
    createAt: { type: String },
    conversationId: { type: String, nullable: true },
  },
})

describe('AgentMessageService message ordering (SQLite)', () => {
  let database: Connection
  let repository: Repository<AgentMessage>
  let service: AgentMessageService

  before(async () => {
    database = await createConnection({
      name: 'agent-message-order-test',
      type: 'sqlite',
      database: ':memory:',
      entities: [agentMessages],
      synchronize: true,
    })
    repository = database.getRepository(agentMessages)
    service = new AgentMessageService(repository as unknown as Repository<any>)
  })

  beforeEach(async () => {
    await repository.clear()
  })

  after(async () => {
    if (database) await database.close()
  })

  it('keeps insertion order for messages created in the same second', async () => {
    const createAt = '2026-01-01 00:00:00'
    for (const position of [1, 2, 3, 4]) {
      await repository.save({
        id: `message-${position}`,
        role: 'user',
        content: `content ${position}`,
        createAt,
        conversationId: 'conversation',
      })
    }
    // The order is reversed inside the service so the page is returned oldest-first, like the UI renders it.
    const { messages } = await service.get('conversation')
    expect(messages.map((message) => message.id)).to.deep.equal(['message-1', 'message-2', 'message-3', 'message-4'])
  })
})
