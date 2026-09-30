import '../mocks/browserStorage'
import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import Vue from 'vue'
import ConnectionInfo from '@/views/connections/ConnectionInfo.vue'
import mqtt from 'mqtt'
import { EventEmitter } from 'events'
import { createClient, getDefaultRecord } from '@/utils/mqttUtils'

function render(client: any, mqttVersion = '5.0') {
  const localVue = createLocalVue()
  localVue.use(ElementUI)
  localVue.directive('clipboard', {})
  return mount(ConnectionInfo, {
    localVue,
    propsData: { connection: { ...getDefaultRecord(), mqttVersion }, titleName: 'A', btnLoading: false, client },
    mocks: { $t: (key: string) => key, $tc: (key: string) => key, $store: { getters: { currentTheme: 'light' } } },
  })
}

describe('Desktop Response Information display', () => {
  it('shows an intact, read-only long value and a clipboard control', () => {
    const value = 'responses/' + 'x'.repeat(5000)
    const wrapper = render({ connected: true, responseInformation: value })
    const input = wrapper.find('.response-information input').element as HTMLInputElement
    expect(input.value).to.equal(value)
    expect(input.readOnly).to.be.true
    expect(input.getAttribute('aria-label')).to.equal('Response Information')
    expect(wrapper.find('.response-information').attributes('title')).to.equal(value)
    expect(wrapper.find('.copy-response-information').attributes('aria-label')).to.equal('common.copyTarget')
    wrapper.destroy()
  })

  it('reacts to CONNACK updates and cleanup on the same client', async () => {
    const originalConnect = mqtt.connect
    mqtt.connect = (() => Object.assign(new EventEmitter(), { connected: true })) as any
    try {
      const { curConnectClient: client } = await createClient({ ...getDefaultRecord(), mqttVersion: '5.0' })
      // ConnectionsDetail owns the client as reactive data before passing it to this panel.
      Vue.observable(client)
      const wrapper = render(client)
      expect(wrapper.find('.response-information').exists()).to.be.false
      client.emit('connect', { properties: { responseInformation: 'responses/first' } })
      await wrapper.vm.$nextTick()
      expect((wrapper.find('.response-information input').element as HTMLInputElement).value).to.equal(
        'responses/first',
      )
      client.emit('connect', { properties: { responseInformation: 'responses/reconnected' } })
      await wrapper.vm.$nextTick()
      expect((wrapper.find('.response-information input').element as HTMLInputElement).value).to.equal(
        'responses/reconnected',
      )
      client.emit('close')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.response-information').exists()).to.be.false
      wrapper.destroy()
    } finally {
      mqtt.connect = originalConnect
    }
  })

  it('shows only the selected connected MQTT 5 client, hiding absent information', async () => {
    const wrapper = render({ connected: true, responseInformation: 'responses/A' })
    expect(wrapper.find('.response-information').exists()).to.be.true
    await wrapper.setProps({ client: { connected: true, responseInformation: 'responses/B' } })
    expect((wrapper.find('.response-information input').element as HTMLInputElement).value).to.equal('responses/B')
    await wrapper.setProps({ client: { connected: true, responseInformation: '' } })
    expect(wrapper.find('.response-information').exists()).to.be.false
    await wrapper.setProps({ client: { connected: false, responseInformation: 'old' } })
    expect(wrapper.find('.response-information').exists()).to.be.false
    wrapper.destroy()
    const mqtt3 = render({ connected: true, responseInformation: 'unexpected' }, '3.1.1')
    expect(mqtt3.find('.response-information').exists()).to.be.false
    mqtt3.destroy()
  })
})
