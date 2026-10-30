import { expect } from 'chai'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import { ApprovalGate, withApproval } from '@/utils/ai/agent/approval'
import { AGENT_ALWAYS_ASK_TOOLS, createMQTTTools } from '@/utils/ai/agent/tools'
import AgentApprovalCard from '@/components/agent/AgentApprovalCard.vue'

const script = 'execute(value => value)'
const calls = [
  { name: 'save_script', input: { name: 'payload.js', type: 'javascript', script } },
  { name: 'test_script', input: { script, type: 'javascript', input: 'hello' } },
  { name: 'apply_script', input: { functionId: 's1', apply: 'all' } },
]

describe('Agent script approval', () => {
  for (const { name, input } of calls) {
    for (const mode of ['auto', 'ask'] as const) {
      it(`should require a fresh decision for ${name} in ${mode} mode even when previously allowed`, async () => {
        const saved = { id: 's1', name: 'payload.js', type: 'javascript', script }
        const deps: any = {
          services: {
            scriptService: { getAll: async () => [], get: async () => saved, create: async () => saved },
          },
          store: { getters: {}, dispatch: async () => undefined },
          getPermissionMode: () => mode,
        }
        const definition = createMQTTTools(deps)[name]
        const gate = new ApprovalGate()
        const awaiting: string[] = []
        let executed = 0
        const tool = withApproval(
          name,
          {
            ...definition,
            execute: async (...args: any[]) => {
              executed += 1
              return (definition.execute as any)(...args)
            },
          },
          { gate, getMode: () => mode, allowedTools: new Set([name]), onAwaiting: (id) => awaiting.push(id) },
          AGENT_ALWAYS_ASK_TOOLS.has(name),
        )

        const pending = tool.execute(input, { toolCallId: 'first' })
        expect(awaiting).to.deep.equal(['first'])
        expect(executed).to.equal(0)
        gate.decide('first', 'always')
        await pending
        expect(executed).to.equal(1)

        const second = tool.execute(input, { toolCallId: 'second' })
        expect(awaiting).to.deep.equal(['first', 'second'])
        gate.decide('second', 'deny')
        expect(await second).to.have.property('denied', true)
        expect(executed).to.equal(1)
      })
    }

    it(`should hide the remember option for ${name}`, () => {
      const wrapper = shallowMount(AgentApprovalCard, {
        localVue: createLocalVue(),
        sync: false,
        propsData: { part: { toolName: name } },
        mocks: { $t: (key: string) => key },
      })
      expect(wrapper.text()).not.to.contain('agent.approval.alwaysAllow')
      wrapper.destroy()
    })
  }

  it('should show the complete code when approving a script save', () => {
    const source = '/* review */\n'.repeat(100)
    const wrapper = shallowMount(AgentApprovalCard, {
      localVue: createLocalVue(),
      sync: false,
      propsData: { part: { toolName: 'save_script', input: { name: 'payload.js', script: source } } },
      mocks: { $t: (key: string) => key },
    })
    expect(wrapper.find('pre').text()).to.contain(source.trim())
    wrapper.destroy()
  })
})
