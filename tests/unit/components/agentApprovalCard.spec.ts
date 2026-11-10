import { expect } from 'chai'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import AgentApprovalCard from '@/components/agent/AgentApprovalCard.vue'

type Translate = (key: string, params?: Record<string, string>) => string

const mountCard = (toolName: string, input: Record<string, unknown>, $t: Translate = (key) => key) =>
  shallowMount(AgentApprovalCard, {
    localVue: createLocalVue(),
    sync: false,
    propsData: { part: { type: 'tool', toolName, input } },
    mocks: { $t },
  })

describe('Agent approval card', () => {
  it('should show the complete code when approving a script save', () => {
    const script = '/* review */\n'.repeat(100)
    const wrapper = shallowMount(AgentApprovalCard, {
      localVue: createLocalVue(),
      sync: false,
      propsData: { part: { type: 'tool', toolName: 'save_script', input: { name: 'payload.js', script } } },
      mocks: { $t: (key: string) => key },
    })

    expect(script.length).to.be.greaterThan(600)
    expect(wrapper.find('pre').text()).to.contain(script.trim())
    wrapper.destroy()
  })

  it('should show the repeat interval of a timed publish', () => {
    const input = { connectionId: 'c1', topic: 'a', payload: 'x' }
    const once = mountCard('publish', input)
    const timed = mountCard('publish', { ...input, intervalSeconds: 5 })

    expect(once.find('.approval-meta').text()).not.to.contain('agent.approvalInterval')
    expect(timed.find('.approval-meta').text()).to.contain('agent.approvalInterval 5s')
    once.destroy()
    timed.destroy()
  })

  it('should show the target of a script tool called by id', () => {
    const wrapper = mountCard('test_script', { id: 'script-1', input: 'hello' })

    expect(wrapper.find('pre').text()).to.contain('script-1')
    wrapper.destroy()
  })

  it('should mask a nested password but keep the other changes visible', () => {
    const wrapper = mountCard('update_connection', {
      connectionId: 'c1',
      changes: { password: 'hunter2', host: 'broker.local' },
    })
    const preview = wrapper.find('pre').text()

    expect(preview).not.to.contain('hunter2')
    expect(preview).to.contain('***')
    expect(preview).to.contain('broker.local')
    wrapper.destroy()
  })

  it('should keep the whole tool name of an MCP tool in the headline', () => {
    const $t: Translate = (_key, params) => Object.values(params ?? {}).join(' ')
    const wrapper = mountCard('srv__read_file__delete_everything', {}, $t)

    expect(wrapper.find('.approval-head').text()).to.contain('read_file__delete_everything')
    wrapper.destroy()
  })
})
