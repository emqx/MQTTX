import { expect } from 'chai'
import Vue from 'vue'
import AgentStep from '@/components/agent/AgentStep.vue'
import AgentStepGroup from '@/components/agent/AgentStepGroup.vue'

/** Stubs the translations while a component mounts; inline `mocks` would need `@vue/test-utils`, which installs a global error handler */
const withTranslations = <T>(mount: () => T): T => {
  const proto = Vue.prototype as any
  const previous = { $t: proto.$t, $tc: proto.$tc }
  proto.$t = (key: string) => key
  proto.$tc = (key: string) => key
  try {
    return mount()
  } finally {
    proto.$t = previous.$t
    proto.$tc = previous.$tc
  }
}

/** Mounts the step on a detached element */
const mountStep = (toolName: string, state = 'done'): Vue =>
  withTranslations(() => {
    const Step = Vue.extend(AgentStep as any)
    const part = { type: 'tool', toolCallId: 'c1', toolName, input: {}, state }
    return new Step({ propsData: { part } }).$mount()
  })

/** The group renders its AgentStep children too, so the translations stay stubbed for the whole mount */
const mountGroup = (toolNames: string[]): Vue =>
  withTranslations(() => {
    const Group = Vue.extend(AgentStepGroup as any)
    const steps = toolNames.map((toolName, index) => ({
      type: 'tool',
      toolCallId: `c${index}`,
      toolName,
      input: {},
      state: 'done',
    }))
    return new Group({ propsData: { steps } }).$mount()
  })

describe('AgentStep tool name', () => {
  it('should show the tool name in every state of a MQTT tool step', () => {
    for (const state of ['running', 'done', 'error', 'denied']) {
      const el = mountStep('get_settings', state).$el as Element
      const tag = el.querySelector('.tool-name')

      expect(Boolean(tag), state).to.equal(true)
      expect(tag?.textContent, state).to.equal('get_settings')
    }
  })

  it('should not repeat the tool name of an MCP step, whose label already names the server and tool', () => {
    const el = mountStep('srv__do_it').$el as Element

    expect(el.querySelector('.tool-name')).to.equal(null)
  })

  it('should name the tools of a collapsed group once each, in the order they first ran', () => {
    const el = mountGroup(['connect', 'subscribe', 'connect']).$el as Element

    expect(el.querySelector('.tool-names')?.textContent).to.equal('connect, subscribe')
  })

  it('should show only the tool part of an MCP tool in the group title', () => {
    const el = mountGroup(['srv__do_it']).$el as Element

    expect(el.querySelector('.tool-names')?.textContent).to.equal('do_it')
  })
})
