import { expect } from 'chai'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import AgentApprovalCard from '@/components/agent/AgentApprovalCard.vue'

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
})
