import { invokeCloud, watchCloudDocument } from './cloudClient'
import { CloudError, cloudIssue } from './cloudErrors'
import type { CloudDocument, CloudState, CloudTheme, CloudConnectionDraft } from '../types/cloud'

interface Frame {
  element: HTMLIFrameElement
  connection: FrameConnection | null
}
interface FrameConnection {
  document: string | null
  port: MessagePort | null
  ready: boolean
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
  private readonly unwatchDocument: () => void

  constructor(private readonly options: FrameManagerOptions) {
    window.addEventListener('message', this.message)
    this.unwatchDocument = watchCloudDocument(this.revokeDocument)
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
        this.closeConnection(frame)
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
        element.name = release.id
        element.src = release.url
        element.dataset.release = release.id
        element.className = 'cloud-frame'
        element.style.display = 'none'
        frame = { element, connection: null }
        this.frames.set(release.id, frame)
        this.options.container.append(element)
        await invokeCloud('mounting', { id: release.id })
      }
      frame.element.style.display = state.active?.id === release.id ? 'block' : 'none'
    }
  }

  syncTheme(): void {
    const frames = [...this.frames.values()].filter((frame) => frame.connection?.ready)
    if (!frames.length) return
    const data = this.options.theme()
    for (const frame of frames) frame.connection?.port?.postMessage({ event: 'theme', data })
  }

  private closeConnection(frame: Frame): void {
    frame.connection?.port?.close()
    frame.connection = null
  }

  private revokeDocument = ({ id, document }: CloudDocument): void => {
    const frame = this.frames.get(id)
    if (frame?.connection && (frame.connection.document === null || frame.connection.document === document))
      this.closeConnection(frame)
  }

  clear(): void {
    this.generation++
    for (const frame of this.frames.values()) {
      this.closeConnection(frame)
      frame.element.remove()
    }
    this.frames.clear()
  }

  dispose(): void {
    if (!this.alive) return
    this.alive = false
    window.removeEventListener('message', this.message)
    this.unwatchDocument()
    for (const id of this.frames.keys()) void invokeCloud('unmount', { id }).catch(() => {})
    this.clear()
  }

  private message = (event: MessageEvent): void => {
    if (!this.alive || event.origin !== 'null' || event.data?.type !== 'mqttx-cloud:hello') return
    const match = [...this.frames.entries()].find(([, frame]) => frame.element.contentWindow === event.source)
    if (!match) return
    const [id, frame] = match
    if (frame.connection) return
    void this.connect(id, frame)
  }

  private async connect(id: string, frame: Frame): Promise<void> {
    const connection: FrameConnection = { document: null, port: null, ready: false }
    frame.connection = connection
    const isCurrent = (): boolean => this.alive && this.frames.get(id) === frame && frame.connection === connection
    let document: string
    try {
      document = await invokeCloud('connect', { id })
    } catch {
      if (isCurrent()) this.closeConnection(frame)
      return
    }
    if (!isCurrent()) return
    connection.document = document
    const page = { id, document }
    const channel = new MessageChannel()
    const port = channel.port1
    connection.port = port
    port.onmessage = async (incoming: MessageEvent) => {
      const msg = incoming.data
      if (!isCurrent() || !msg || !Number.isSafeInteger(msg.seq)) return
      try {
        let data
        if (msg.method === 'ready') {
          const state = await invokeCloud('ready', page)
          if (!isCurrent()) return
          await this.options.onState(state)
          if (!isCurrent()) return
          connection.ready = true
          this.syncTheme()
        } else if (msg.method === 'theme') data = this.options.theme()
        else if (connection.ready && msg.method === 'request') {
          data = await invokeCloud('request', { ...page, method: msg.params?.method, path: msg.params?.path })
        } else if (connection.ready && msg.method === 'createConnection') {
          const draft = await invokeCloud('createConnection', { ...page, connection: msg.params })
          if (!isCurrent()) return
          this.options.onCreateConnection(draft)
        } else if (connection.ready && msg.method === 'copyText') {
          await invokeCloud('copyText', { ...page, text: msg.params?.text })
        } else if (connection.ready && msg.method === 'copyConnection') {
          await invokeCloud('copyConnection', { ...page, connection: msg.params })
        } else if (connection.ready && msg.method === 'removeExtension') {
          await invokeCloud('requestRemove', page)
          if (!isCurrent()) return
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
