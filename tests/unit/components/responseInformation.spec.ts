import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import Vue from 'vue'
import { DirectiveBinding } from 'vue/types/options'
import ResponseInformation from '@/views/connections/ResponseInformation.vue'
import mqtt from 'mqtt'
import { EventEmitter } from 'events'
import { createClient, getDefaultRecord } from '@/utils/mqttUtils'

const originalResizeObserver = window.ResizeObserver

function render(
  client: Pick<ConnectionClient, 'connected' | 'responseInformation'>,
  { mqttVersion = '5.0', previewClipped = true } = {},
) {
  window.ResizeObserver = class implements ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}

    observe(target: Element): void {
      Object.defineProperties(target, {
        clientWidth: { configurable: true, value: previewClipped ? 100 : 200 },
        scrollWidth: { configurable: true, value: 200 },
      })
      this.callback([], this)
    }

    unobserve(): void {}

    disconnect(): void {}
  }
  const localVue = createLocalVue()
  localVue.use(ElementUI)
  const captureClipboard = (element: HTMLElement, binding: DirectiveBinding) => {
    if (binding.arg === 'copy') element.setAttribute('data-clipboard-value', binding.value)
  }
  localVue.directive('clipboard', { bind: captureClipboard, update: captureClipboard })
  return mount(ResponseInformation, {
    localVue,
    attachToDocument: true,
    propsData: { client, mqttVersion },
    mocks: { $t: (key: string) => key, $tc: (key: string) => key },
  })
}

describe('Desktop Response Information display', () => {
  afterEach(() => {
    window.ResizeObserver = originalResizeObserver
  })

  it('preserves the full value with a single clipboard control and no repeated popover actions', () => {
    const value = 'responses/' + 'x'.repeat(5000)
    const wrapper = render({ connected: true, responseInformation: value })
    expect(wrapper.find('.response-information-preview').text()).to.equal(value)
    expect(wrapper.find('.response-information-value').text()).to.equal(value)
    expect(wrapper.findAll('.copy-response-information').length).to.equal(1)
    const copyButton = wrapper.find('.copy-response-information')
    expect(copyButton.attributes('data-clipboard-value')).to.equal(value)
    expect(copyButton.attributes('aria-label')).to.equal('common.copyTarget')
    wrapper.destroy()
  })

  it('opens full details and dismisses them with Escape, the same trigger, or an outside click', async () => {
    const wrapper = render({ connected: true, responseInformation: 'responses/client-1' })
    await wrapper.vm.$nextTick()
    const reference = wrapper.find('.response-information-reference')
    expect(reference.attributes('aria-expanded')).to.equal('false')
    await reference.trigger('click')
    expect(reference.attributes('aria-expanded')).to.equal('true')
    const popover = document.body.querySelector('.response-information-popover') as HTMLElement
    expect(popover.style.display).not.to.equal('none')
    expect(popover.querySelector('.response-information-value')!.textContent).to.equal('responses/client-1')
    await reference.trigger('keydown', { key: 'Escape', keyCode: 27 })
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(document.activeElement).to.equal(reference.element)
    await reference.trigger('click')
    await reference.trigger('click')
    expect(reference.attributes('aria-expanded')).to.equal('false')
    await reference.trigger('click')
    const detail = popover.querySelector('.response-information-value') as HTMLElement
    detail.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(document.activeElement).to.equal(reference.element)
    await reference.trigger('click')
    document.body.click()
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    wrapper.destroy()
  })

  it('shows a complete short value without an unnecessary duplicate popover', async () => {
    const wrapper = render({ connected: true, responseInformation: 'responses/client-1' }, { previewClipped: false })
    await wrapper.vm.$nextTick()
    const reference = wrapper.find('.response-information-reference')
    ;(reference.element as HTMLButtonElement).click()
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal('responses/client-1')
    wrapper.destroy()
  })

  it('reacts to CONNACK updates and cleanup on the same client', async () => {
    const originalConnect = mqtt.connect
    mqtt.connect = (() => Object.assign(new EventEmitter(), { connected: true })) as any
    try {
      const { curConnectClient: client } = await createClient({ ...getDefaultRecord(), mqttVersion: '5.0' })
      Vue.observable(client)
      const wrapper = render(client)
      expect(wrapper.find('.response-information').exists()).to.be.false
      client.emit('connect', { properties: { responseInformation: 'responses/first' } })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.response-information-preview').text()).to.equal('responses/first')
      client.emit('connect', { properties: { responseInformation: 'responses/reconnected' } })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.response-information-preview').text()).to.equal('responses/reconnected')
      expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal(
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

  it('closes an open popover when switching clients and copies the newly selected value', async () => {
    const wrapper = render({ connected: true, responseInformation: 'responses/A' })
    await wrapper.vm.$nextTick()
    await wrapper.find('.response-information-reference').trigger('click')
    expect(wrapper.find('.response-information-reference').attributes('aria-expanded')).to.equal('true')
    await wrapper.setProps({ client: { connected: true, responseInformation: 'responses/B' } })
    expect(wrapper.find('.response-information-reference').attributes('aria-expanded')).to.equal('false')
    expect(wrapper.find('.response-information-preview').text()).to.equal('responses/B')
    expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal('responses/B')
    wrapper.destroy()
  })

  it('hides absent information, disconnected clients, and MQTT 3 clients', async () => {
    const wrapper = render({ connected: true, responseInformation: 'responses/A' })
    expect(wrapper.find('.response-information').exists()).to.be.true
    await wrapper.setProps({ client: { connected: true, responseInformation: '' } })
    expect(wrapper.find('.response-information').exists()).to.be.false
    await wrapper.setProps({ client: { connected: false, responseInformation: 'old' } })
    expect(wrapper.find('.response-information').exists()).to.be.false
    await wrapper.setProps({ client: { connected: true, responseInformation: 'unexpected' }, mqttVersion: '3.1.1' })
    expect(wrapper.find('.response-information').exists()).to.be.false
    wrapper.destroy()
  })
})
