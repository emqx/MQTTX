import { Worker } from 'worker_threads'
import { CloudError, cloudError, cloudIssue } from '../../utils/cloudErrors'
import { logCloudFailure } from './diagnostics'

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

// Runs the signed extension's business code outside the browser's CORS boundary.
export class CloudBackend {
  private readonly worker: Worker
  private readonly pending = new Map<number, Pending>()
  private sequence = 0
  private stopped = false
  readonly ready: Promise<void>

  constructor(file: string, host: (method: string, params: unknown) => unknown | Promise<unknown>) {
    this.worker = new Worker(file, { execArgv: [] })
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new CloudError('REQUEST_TIMEOUT'))
        this.dispose()
      }, 15000)
      const failed = (error: Error): void => {
        clearTimeout(timer)
        reject(error)
        this.dispose()
      }
      this.worker.on('message', async (message) => {
        if (this.stopped) return
        if (message.type === 'ready') {
          clearTimeout(timer)
          resolve()
        } else if (message.type === 'result') {
          const item = this.pending.get(message.seq)
          if (!item) return
          this.pending.delete(message.seq)
          clearTimeout(item.timer)
          message.ok ? item.resolve(message.data) : item.reject(cloudError(message.error))
        } else if (message.type === 'host') {
          try {
            const data = await host(message.method, message.params)
            if (!this.stopped) this.worker.postMessage({ type: 'host-result', seq: message.seq, ok: true, data })
          } catch (error) {
            if (!this.stopped)
              this.worker.postMessage({ type: 'host-result', seq: message.seq, ok: false, error: cloudIssue(error) })
          }
        }
      })
      this.worker.on('error', (error) => {
        logCloudFailure('extension backend', error)
        failed(new CloudError('OPERATION_FAILED'))
      })
      this.worker.on('exit', () => failed(new CloudError('EXTENSION_STOPPED')))
    })
  }

  async call(method: string, params: unknown): Promise<unknown> {
    await this.ready
    if (this.stopped) throw new CloudError('EXTENSION_STOPPED')
    if (this.pending.size >= 32) throw new CloudError('REQUEST_LIMIT')
    return new Promise((resolve, reject) => {
      const seq = ++this.sequence
      const timer = setTimeout(() => {
        this.pending.delete(seq)
        reject(new CloudError('REQUEST_TIMEOUT'))
      }, 15000)
      this.pending.set(seq, { resolve, reject, timer })
      this.worker.postMessage({ type: 'call', seq, method, params })
    })
  }

  dispose(): void {
    if (this.stopped) return
    this.stopped = true
    for (const item of this.pending.values()) {
      clearTimeout(item.timer)
      item.reject(new CloudError('EXTENSION_STOPPED'))
    }
    this.pending.clear()
    void this.worker.terminate()
  }
}
