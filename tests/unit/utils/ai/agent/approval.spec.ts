import { expect } from 'chai'
import { ApprovalGate, ApprovalContext, withApproval } from '@/utils/ai/agent/approval'

describe('approval', () => {
  const createContext = (overrides: Partial<ApprovalContext> = {}): ApprovalContext => ({
    gate: new ApprovalGate(),
    getMode: () => 'ask',
    allowedTools: new Set<string>(),
    onAwaiting: () => undefined,
    ...overrides,
  })

  it('should wait for the decision in ask mode, then execute once', async () => {
    const gate = new ApprovalGate()
    const awaiting: string[] = []
    const approved: string[] = []
    let executed = 0
    const tool = withApproval(
      'publish',
      {
        execute: async () => {
          executed += 1
          return 'ok'
        },
      },
      createContext({ gate, onAwaiting: (id) => awaiting.push(id), onApproved: (id) => approved.push(id) }),
    )

    const pending = tool.execute({}, { toolCallId: 'c1' })
    expect(awaiting).to.deep.equal(['c1'])
    expect(executed).to.equal(0)

    gate.decide('c1', 'once')
    expect(await pending).to.equal('ok')
    expect(executed).to.equal(1)
    expect(approved).to.deep.equal(['c1'])
  })

  it('should execute directly in auto mode', async () => {
    let executed = 0
    const tool = withApproval(
      'publish',
      {
        execute: async () => {
          executed += 1
          return 'ok'
        },
      },
      createContext({ getMode: () => 'auto' }),
    )

    expect(await tool.execute({}, { toolCallId: 'c1' })).to.equal('ok')
    expect(executed).to.equal(1)
  })

  it('should stop asking after an always decision', async () => {
    const gate = new ApprovalGate()
    const allowedTools = new Set<string>()
    const awaiting: string[] = []
    const tool = withApproval(
      'publish',
      { execute: async () => 'ok' },
      createContext({ gate, allowedTools, onAwaiting: (id) => awaiting.push(id) }),
    )

    const first = tool.execute({}, { toolCallId: 'c1' })
    gate.decide('c1', 'always')
    await first
    expect(allowedTools.has('publish')).to.equal(true)

    awaiting.length = 0
    await tool.execute({}, { toolCallId: 'c2' })
    expect(awaiting).to.deep.equal([])
  })

  it('should return a refusal without executing when denied', async () => {
    const gate = new ApprovalGate()
    const approved: string[] = []
    let executed = 0
    const tool = withApproval(
      'publish',
      {
        execute: async () => {
          executed += 1
          return 'ok'
        },
      },
      createContext({ gate, onApproved: (id) => approved.push(id) }),
    )

    const pending = tool.execute({}, { toolCallId: 'c1' })
    gate.decide('c1', 'deny')

    expect(await pending).to.deep.equal({ denied: true, message: 'The user denied this action.' })
    expect(executed).to.equal(0)
    expect(approved).to.deep.equal([])
  })

  it('should reject a waiting request when the gate is denied', async () => {
    const gate = new ApprovalGate()
    const tool = withApproval('publish', { execute: async () => 'ok' }, createContext({ gate }))

    const pending = tool.execute({}, { toolCallId: 'c1' })
    gate.denyAll()

    let error: unknown
    try {
      await pending
    } catch (caught) {
      error = caught
    }
    expect(error).to.be.instanceOf(Error)
  })

  it('should leave tools without an execute function untouched', () => {
    const bare = {}
    expect(withApproval('publish', bare, createContext())).to.equal(bare)
  })
})
