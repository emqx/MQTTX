import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import Vue from 'vue'
import { DirectiveBinding } from 'vue/types/options'
import ResponseInformation from '@/views/connections/ResponseInformation.vue'
import { MqttClient, IConnackPacket } from 'mqtt'
import { generate } from 'mqtt-packet'
import { Duplex } from 'stream'

const originalResizeObserver = window.ResizeObserver

function connack(responseInformation?: string): IConnackPacket {
  return {
    cmd: 'connack',
    sessionPresent: false,
    reasonCode: 0,
    properties: responseInformation === undefined ? undefined : { responseInformation },
  }
}

function createMemoryClient() {
  let stream: Duplex
  const client = new MqttClient(
    () => {
      stream = new Duplex({
        read() {},
        write(_chunk, _encoding, callback) {
          callback()
        },
      })
      return stream
    },
    { clientId: 'response-info-unit-test', protocolVersion: 5, keepalive: 0, reconnectPeriod: 0 },
  )
  return {
    client,
    async connect(responseInformation?: string) {
      const connected = new Promise<void>((resolve) => client.once('connect', () => resolve()))
      stream.push(generate(connack(responseInformation), { protocolVersion: 5 }))
      await connected
      await Vue.nextTick()
    },
    async close() {
      const closed = new Promise<void>((resolve) => client.once('close', () => resolve()))
      stream.destroy()
      await closed
      await Vue.nextTick()
    },
    end() {
      return new Promise<void>((resolve) => client.end(true, {}, () => resolve()))
    },
  }
}

function render(
  client: Pick<MqttClient, 'connected' | 'connackPacket'>,
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
    const wrapper = render({ connected: true, connackPacket: connack(value) })
    expect(wrapper.find('.response-information-preview').text()).to.equal(value)
    expect(wrapper.find('.response-information-value').text()).to.equal(value)
    expect(wrapper.findAll('.copy-response-information').length).to.equal(1)
    const copyButton = wrapper.find('.copy-response-information')
    expect(copyButton.attributes('data-clipboard-value')).to.equal(value)
    expect(copyButton.attributes('aria-label')).to.equal('common.copyTarget')
    wrapper.destroy()
  })

  it('opens full details and dismisses them with Escape, the same trigger, or an outside click', async () => {
    const wrapper = render({ connected: true, connackPacket: connack('responses/client-1') })
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
    const wrapper = render({ connected: true, connackPacket: connack('responses/client-1') }, { previewClipped: false })
    await wrapper.vm.$nextTick()
    const reference = wrapper.find('.response-information-reference')
    ;(reference.element as HTMLButtonElement).click()
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal('responses/client-1')
    wrapper.destroy()
  })

  it('reads MQTT.js CONNACK state reactively through reconnects without adding client listeners', async () => {
    const session = createMemoryClient()
    const { client } = session
    Vue.observable(client)
    const closeListenerCount = client.listenerCount('close')
    const connectListenerCount = client.listenerCount('connect')
    const wrapper = render(client)
    try {
      expect(client.listenerCount('close')).to.equal(closeListenerCount)
      expect(client.listenerCount('connect')).to.equal(connectListenerCount)
      expect(wrapper.find('.response-information').exists()).to.be.false
      await session.connect('responses/first')
      expect(wrapper.find('.response-information-preview').text()).to.equal('responses/first')
      await session.close()
      expect(wrapper.find('.response-information').exists()).to.be.false
      client.reconnect()
      await session.connect('responses/reconnected')
      expect(wrapper.find('.response-information-preview').text()).to.equal('responses/reconnected')
      expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal(
        'responses/reconnected',
      )
      await session.close()
      client.reconnect()
      await session.connect()
      expect(wrapper.find('.response-information').exists()).to.be.false
    } finally {
      wrapper.destroy()
      await session.end()
    }
  })

  it('closes an open popover when switching clients and copies the newly selected value', async () => {
    const wrapper = render({ connected: true, connackPacket: connack('responses/A') })
    await wrapper.vm.$nextTick()
    await wrapper.find('.response-information-reference').trigger('click')
    expect(wrapper.find('.response-information-reference').attributes('aria-expanded')).to.equal('true')
    await wrapper.setProps({ client: { connected: true, connackPacket: connack('responses/B') } })
    expect(wrapper.find('.response-information-reference').attributes('aria-expanded')).to.equal('false')
    expect(wrapper.find('.response-information-preview').text()).to.equal('responses/B')
    expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal('responses/B')
    wrapper.destroy()
  })

  it('hides absent information, disconnected clients, and MQTT 3 clients', async () => {
    const wrapper = render({ connected: true, connackPacket: connack('responses/A') })
    expect(wrapper.find('.response-information').exists()).to.be.true
    await wrapper.setProps({ client: { connected: true, connackPacket: connack() } })
    expect(wrapper.find('.response-information').exists()).to.be.false
    await wrapper.setProps({ client: { connected: false, connackPacket: connack('old') } })
    expect(wrapper.find('.response-information').exists()).to.be.false
    await wrapper.setProps({ client: { connected: true, connackPacket: connack('unexpected') }, mqttVersion: '3.1.1' })
    expect(wrapper.find('.response-information').exists()).to.be.false
    wrapper.destroy()
  })
})
