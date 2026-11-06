import { invokeCloud } from './cloudClient'
import { CloudError, cloudIssue } from './cloudErrors'
import type { CloudState, CloudTheme } from '../types/cloud'

interface Frame {
  element: HTMLIFrameElement
  port: MessagePort | null
  ready: boolean
  connecting: boolean
}
interface FrameManagerOptions {
  container: HTMLElement
  theme: () => CloudTheme
  onState: (state: CloudState) => Promise<void>
}

// Owns renderer-side extension frames and their message channels, independently of Vue.
export class CloudFrameManager {
  private readonly frames = new Map<string, Frame>()
  private activeVersion: string | undefined
  private alive = true
  private generation = 0

  constructor(private readonly options: FrameManagerOptions) {
    window.addEventListener('message', this.message)
  }

  async sync(state: CloudState): Promise<void> {
    if (!this.alive) return
    if (state.session.status !== 'signed-in') {
      for (const id of this.frames.keys()) void invokeCloud('unmount', { id }).catch(() => {})
      this.clear()
      return
    }
    this.activeVersion = state.active?.version
    const generation = this.generation
    const releases = [state.active, state.candidate].filter((release): release is NonNullable<typeof release> =>
      Boolean(release),
    )
    for (const [id, frame] of this.frames) {
      if (!releases.some((release) => release.id === id)) {
        frame.port?.close()
        frame.element.remove()
        this.frames.delete(id)
      }
    }
    for (const release of releases) {
      if (!this.alive || generation !== this.generation) return
      let frame = this.frames.get(release.id)
      if (!frame) {
        const element = document.createElement('iframe')
        element.setAttribute('sandbox', 'allow-scripts')
        element.setAttribute('referrerpolicy', 'no-referrer')
        element.title = 'EMQX Cloud'
        element.src = release.url
        element.dataset.release = release.id
        element.className = 'cloud-frame'
        element.style.display = 'none'
        frame = { element, port: null, ready: false, connecting: false }
        this.frames.set(release.id, frame)
        this.options.container.append(element)
        await invokeCloud('mounting', { id: release.id })
      }
      frame.element.style.display = state.active?.id === release.id ? 'block' : 'none'
    }
  }

  syncTheme(): void {
    const frames = [...this.frames.values()].filter((frame) => frame.ready)
    if (!frames.length) return
    const data = this.options.theme()
    for (const frame of frames) frame.port?.postMessage({ event: 'theme', data })
  }

  clear(): void {
    this.generation++
    for (const frame of this.frames.values()) {
      frame.port?.close()
      frame.element.remove()
    }
    this.frames.clear()
  }

  dispose(): void {
    if (!this.alive) return
    this.alive = false
    window.removeEventListener('message', this.message)
    for (const id of this.frames.keys()) void invokeCloud('unmount', { id }).catch(() => {})
    this.clear()
  }

  private message = (event: MessageEvent): void => {
    if (!this.alive || event.origin !== 'null' || event.data?.type !== 'mqttx-cloud:hello') return
    const match = [...this.frames.entries()].find(([, frame]) => frame.element.contentWindow === event.source)
    if (!match) return
    const [id, frame] = match
    if (frame.connecting) return
    frame.connecting = true
    const channel = new MessageChannel()
    frame.port = channel.port1
    frame.port.onmessage = async (incoming: MessageEvent) => {
      const msg = incoming.data
      if (!this.alive || this.frames.get(id) !== frame || !msg || !Number.isSafeInteger(msg.seq)) return
      try {
        let data
        if (msg.method === 'ready') {
          await this.options.onState(await invokeCloud('ready', { id }))
          if (!this.alive || this.frames.get(id) !== frame) return
          frame.ready = true
          this.syncTheme()
          data = { version: this.activeVersion }
        } else if (msg.method === 'theme') data = this.options.theme()
        else if (frame.ready && msg.method === 'credential') data = await invokeCloud('credential', { id })
        else if (frame.ready && (msg.method === 'validate' || msg.method === 'reject')) {
          const generation = msg.params?.generation
          if (typeof generation !== 'number' || !Number.isSafeInteger(generation))
            throw new CloudError('OPERATION_DENIED')
          data = await invokeCloud(msg.method, { id, generation })
        } else throw new CloudError('OPERATION_DENIED')
        if (this.alive && this.frames.get(id) === frame) frame.port?.postMessage({ seq: msg.seq, ok: true, data })
      } catch (error) {
        if (this.alive && this.frames.get(id) === frame)
          frame.port?.postMessage({ seq: msg.seq, ok: false, error: cloudIssue(error) })
      }
    }
    frame.element.contentWindow?.postMessage({ type: 'mqttx-cloud:connect' }, '*', [channel.port2])
  }
}
