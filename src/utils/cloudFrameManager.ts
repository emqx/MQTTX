import { invokeCloud } from './cloudClient'
import { CloudError, cloudIssue } from './cloudErrors'
import type { CloudState, CloudTheme, CloudConnectionDraft } from '../types/cloud'

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
  onCreateConnection: (connection: CloudConnectionDraft) => void
  onRemove: () => void
}

// Owns renderer-side extension frames and their message channels, independently of Vue.
export class CloudFrameManager {
  private readonly frames = new Map<string, Frame>()
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
        if (release.version === 'development') {
          const developmentFrame = frame
          element.addEventListener('load', () => {
            void invokeCloud('unmount', { id: release.id }).catch(() => {})
            developmentFrame.port?.close()
            developmentFrame.port = null
            developmentFrame.connecting = false
            developmentFrame.ready = false
          })
        }
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
    const port = channel.port1
    frame.port = port
    const isCurrent = (): boolean => this.alive && this.frames.get(id) === frame && frame.port === port
    port.onmessage = async (incoming: MessageEvent) => {
      const msg = incoming.data
      if (!isCurrent() || !msg || !Number.isSafeInteger(msg.seq)) return
      try {
        let data
        if (msg.method === 'ready') {
          await this.options.onState(await invokeCloud('ready', { id }))
          if (!isCurrent()) return
          frame.ready = true
          this.syncTheme()
        } else if (msg.method === 'theme') data = this.options.theme()
        else if (frame.ready && msg.method === 'request') {
          data = await invokeCloud('request', { id, method: msg.params?.method, path: msg.params?.path })
        } else if (frame.ready && msg.method === 'createConnection') {
          const connection = await invokeCloud('createConnection', { id, connection: msg.params })
          if (!isCurrent()) return
          this.options.onCreateConnection(connection)
        } else if (frame.ready && msg.method === 'copyText') {
          await invokeCloud('copyText', { id, text: msg.params?.text })
        } else if (frame.ready && msg.method === 'copyConnection') {
          await invokeCloud('copyConnection', { id, connection: msg.params })
        } else if (frame.ready && msg.method === 'removeExtension') {
          this.options.onRemove()
        } else throw new CloudError('OPERATION_DENIED')
        if (isCurrent()) port.postMessage({ seq: msg.seq, ok: true, data })
      } catch (error) {
        if (isCurrent()) port.postMessage({ seq: msg.seq, ok: false, error: cloudIssue(error) })
      }
    }
    frame.element.contentWindow?.postMessage({ type: 'mqttx-cloud:connect' }, '*', [channel.port2])
  }
}
