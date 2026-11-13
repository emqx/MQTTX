import { assert } from 'chai'
import { ipcRenderer } from 'electron'
import { CloudFrameManager } from '../../../src/utils/cloudFrameManager'
import type { CloudState, CloudTheme } from '../../../src/types/cloud'

class TestPort {
  messages: any[] = []
  closed = false
  onmessage: ((event: MessageEvent) => void | Promise<void>) | null = null
  postMessage(message: unknown): void {
    this.messages.push(message)
  }
  close(): void {
    this.closed = true
  }
  async request(data: unknown): Promise<void> {
    await this.onmessage?.({ data } as MessageEvent)
  }
}

describe('Cloud frame lifecycle and bridge', () => {
  const invoke = ipcRenderer.invoke
  const channelDescriptor = Object.getOwnPropertyDescriptor(global, 'MessageChannel')
  const first = { id: 'r-12345678-1234-1234-1234-123456789abc', version: '1.0.0', url: 'https://example.com/first' }
  const second = { id: 'r-22345678-1234-1234-1234-123456789abc', version: '1.0.1', url: 'https://example.com/second' }
  let state: CloudState
  let container: HTMLElement
  let manager: CloudFrameManager
  let channels: Array<{ port1: TestPort; port2: TestPort }>
  let calls: string[]
  const theme: CloudTheme = { lang: 'en', messages: {}, tokens: { '--color-bg-normal': '#fff' } }

  function hello(element: HTMLIFrameElement, origin = 'null', source = element.contentWindow): void {
    element.contentWindow!.postMessage = () => {}
    window.dispatchEvent(new window.MessageEvent('message', { origin, source, data: { type: 'mqttx-cloud:hello' } }))
  }
  beforeEach(() => {
    channels = []
    calls = []
    Object.defineProperty(global, 'MessageChannel', {
      configurable: true,
      value: class {
        port1 = new TestPort()
        port2 = new TestPort()
        constructor() {
          channels.push(this)
        }
      },
    })
    container = document.createElement('div')
    document.body.append(container)
    state = {
      revision: 1,
      removed: false,
      busy: false,
      active: first,
      candidate: second,
      error: null,
      updateError: null,
      session: { status: 'signed-in', message: null, expiresAt: null },
    }
    ipcRenderer.invoke = async (_channel, method) => {
      calls.push(method)
      if (method === 'ready') state = { ...state, revision: 2, active: second, candidate: null }
      return { ok: true, data: state }
    }
    manager = new CloudFrameManager({ container, theme: () => theme, onState: (next) => manager.sync(next) })
  })
  afterEach(() => {
    manager.dispose()
    container.remove()
    ipcRenderer.invoke = invoke
    if (channelDescriptor) Object.defineProperty(global, 'MessageChannel', channelDescriptor)
    else Reflect.deleteProperty(global, 'MessageChannel')
  })

  it('checks frame source and origin, denies premature backend calls and switches only after readiness', async () => {
    await manager.sync(state)
    const frames = container.querySelectorAll('iframe')
    assert.strictEqual(frames[0].style.display, 'block')
    assert.strictEqual(frames[1].style.display, 'none')
    assert.strictEqual(frames[1].getAttribute('sandbox'), 'allow-scripts')
    hello(frames[1], 'https://example.com')
    hello(frames[1], 'null', window)
    assert.lengthOf(channels, 0)
    hello(frames[1])
    hello(frames[1])
    assert.lengthOf(channels, 1)
    const port = channels[0].port1
    await port.request({ seq: 1, method: 'backend', params: { method: 'deployments' } })
    assert.strictEqual(port.messages[0].error.code, 'OPERATION_DENIED')
    assert.notInclude(calls, 'backend')
    await port.request({ seq: 2, method: 'ready' })
    assert.lengthOf(container.querySelectorAll('iframe'), 1)
    assert.strictEqual(container.querySelector('iframe')!.dataset.release, second.id)
    assert.strictEqual(container.querySelector('iframe')!.style.display, 'block')
    assert.deepInclude(port.messages, { seq: 2, ok: true, data: { version: second.version } })
    await port.request({ seq: 3, method: 'deployments' })
    assert.strictEqual(port.messages[port.messages.length - 1].error.code, 'OPERATION_DENIED')
    await port.request({ seq: 4, method: 'validate', params: { generation: '1' } })
    assert.strictEqual(port.messages[port.messages.length - 1].error.code, 'OPERATION_DENIED')
    await port.request({ seq: 5, method: 'credential' })
    assert.strictEqual(port.messages[port.messages.length - 1].error.code, 'OPERATION_DENIED')
    assert.notInclude(calls, 'credential')
    await port.request({ seq: 6, method: 'backend', params: { method: 'deployments' } })
    assert.include(calls, 'backend')
    manager.syncTheme()
    assert.deepInclude(port.messages, { event: 'theme', data: theme })
  })

  it('closes channels on disposal and discards a pending reply from a retired frame', async () => {
    await manager.sync(state)
    hello(container.querySelectorAll('iframe')[1])
    const port = channels[0].port1
    await port.request({ seq: 1, method: 'ready' })
    let finish!: (value: unknown) => void
    ipcRenderer.invoke = () => new Promise((resolve) => (finish = resolve))
    const reply = port.request({ seq: 2, method: 'backend', params: { method: 'deployments' } })
    const complete = finish
    const count = port.messages.length
    manager.dispose()
    complete({ ok: true, data: { value: 'transient-credential' } })
    await reply
    assert.isTrue(port.closed)
    assert.lengthOf(container.querySelectorAll('iframe'), 0)
    assert.lengthOf(port.messages, count)
  })

  it('reconnects a development frame after a full reload and discards replies from the old connection', async () => {
    state = { ...state, active: { ...first, version: 'development' }, candidate: null }
    ipcRenderer.invoke = async () => ({ ok: true, data: state })
    await manager.sync(state)
    const element = container.querySelector('iframe')!
    hello(element)
    const firstPort = channels[0].port1
    await firstPort.request({ seq: 1, method: 'ready' })
    let finish!: (value: unknown) => void
    ipcRenderer.invoke = () =>
      new Promise((resolve) => {
        finish = resolve
      })
    const pending = firstPort.request({ seq: 2, method: 'backend', params: { method: 'deployments' } })
    const complete = finish
    element.dispatchEvent(new Event('load'))
    assert.isTrue(firstPort.closed)
    hello(element)
    assert.lengthOf(channels, 2)
    await channels[1].port1.request({ seq: 2, method: 'theme' })
    complete({ ok: true, data: { value: 'old-connection' } })
    await pending
    assert.deepEqual(channels[1].port1.messages, [{ seq: 2, ok: true, data: theme }])
  })
  it('does not recreate frames when cleared during an unfinished mounting request', async () => {
    let finish!: (value: unknown) => void
    ipcRenderer.invoke = () => new Promise((resolve) => (finish = resolve))
    const syncing = manager.sync(state)
    manager.clear()
    finish({ ok: true, data: state })
    await syncing
    assert.lengthOf(container.querySelectorAll('iframe'), 0)
  })
  it('unmounts business frames when the host session ends and keeps login outside the extension', async () => {
    await manager.sync(state)
    assert.lengthOf(container.querySelectorAll('iframe'), 2)
    await manager.sync({ ...state, session: { status: 'signed-out', message: null, expiresAt: null } })
    assert.lengthOf(container.querySelectorAll('iframe'), 0)
    assert.include(calls, 'unmount')
  })
})
