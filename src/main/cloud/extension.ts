import { CloudError, cloudIssue } from '../../utils/cloudErrors'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { randomUUID, randomBytes, verify, KeyObject } from 'crypto'
import { atomicJSON } from './storage'
import { installCloudPackage } from './installer'
import { EventEmitter } from 'events'
import { compareVersions } from 'compare-versions'
import { inspect, newer, releaseVersion } from './manifest'
import { logCloudFailure } from './diagnostics'
import type { CloudRelease, CloudReleaseInfo, ExtensionSnapshot, CloudIssue } from '../../types/cloud'
import { AddressInfo } from 'net'

interface SavedState {
  removed: boolean
  active: CloudRelease | null
}
interface CatalogRelease {
  id: string
  version: string
  apiVersion: number
  url: string
  sha256: string
  signature?: string
}
interface ExtensionOptions {
  root: string
  catalogURL: string
  publicKey?: string | KeyObject
  now?: () => number
  checkInterval?: number
  readyTimeout?: number
  installWorkerPath?: string
  cloudURL: string
}

function remoteURL(value: string | URL): URL {
  const u = new URL(value)
  if (
    u.username ||
    u.password ||
    u.hash ||
    !(u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === '127.0.0.1'))
  )
    throw new CloudError('INVALID_SERVICE_URL')
  return u
}
export async function boundedFetch(url: string, max: number, signal: AbortSignal): Promise<Buffer> {
  const response = await fetch(remoteURL(url), { redirect: 'error', signal })
  if (!response.ok) throw new CloudError('DOWNLOAD_UNAVAILABLE', { status: response.status })
  const chunks: Buffer[] = []
  let size = 0
  if (!response.body) throw new CloudError('DOWNLOAD_FAILED')
  const reader = response.body.getReader()
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.length
      if (size > max) throw new CloudError('PACKAGE_TOO_LARGE')
      chunks.push(Buffer.from(part.value))
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return Buffer.concat(chunks)
}
export class CloudExtension extends EventEmitter {
  private readonly installWorkerPath?: string
  readonly root: string
  readonly catalogURL: string
  private readonly publicKey: string | KeyObject
  private readonly now: () => number
  readonly checkInterval: number
  private readonly readyTimeout: number
  private readonly cloudURL: string
  private readonly statePath: string
  private readonly releases: string
  private saved: SavedState
  private active: CloudRelease | null
  private candidate: CloudRelease | null
  private busy: boolean
  private error: CloudIssue | null
  private updateError: CloudIssue | null
  private epoch: number
  private lastCheck: number
  private abort: AbortController | null
  private job: Promise<void> | null
  private server: http.Server | null
  private readonly secret: string
  private origin = ''
  private timer: ReturnType<typeof setTimeout> | undefined
  private mountStarted = false
  private readonly rejected: Set<string>
  constructor({
    root,
    catalogURL,
    publicKey = '',
    now = Date.now,
    checkInterval = 3600000,
    readyTimeout = 15000,
    cloudURL,
    installWorkerPath,
  }: ExtensionOptions) {
    super()
    this.installWorkerPath = installWorkerPath
    this.cloudURL = cloudURL
    this.root = root
    this.catalogURL = catalogURL
    this.publicKey = publicKey
    this.now = now
    this.checkInterval = checkInterval
    this.readyTimeout = readyTimeout
    this.statePath = path.join(root, 'extension.json')
    this.releases = path.join(root, 'releases')
    this.saved = { removed: false, active: null }
    try {
      if (fs.existsSync(this.statePath)) this.saved = JSON.parse(fs.readFileSync(this.statePath, 'utf8'))
    } catch {
      this.saved = { removed: true, active: null }
    }
    if (this.saved.active && !/^r-[a-f0-9-]{36}$/.test(this.saved.active.id)) this.saved.active = null
    this.active = null
    this.candidate = null
    this.busy = false
    this.error = null
    this.updateError = null
    this.epoch = 0
    this.lastCheck = -Infinity
    this.abort = null
    this.job = null
    this.server = null
    this.secret = randomBytes(24).toString('hex')
    this.timer = undefined
    this.rejected = new Set<string>()
  }
  private persist(): void {
    atomicJSON(this.statePath, this.saved)
  }
  get removed(): boolean {
    return this.saved.removed
  }
  isActive(id: string): boolean {
    return this.active?.id === id
  }
  async retry(): Promise<ExtensionSnapshot> {
    this.rejected.clear()
    if (!this.removed) {
      await this.enter()
      this.check()
    }
    return this.snapshot()
  }
  snapshot(): ExtensionSnapshot {
    const info = (item: CloudRelease | null): CloudReleaseInfo | null =>
      item ? { id: item.id, version: item.version, url: `${this.origin}/${this.secret}/${item.id}/index.html` } : null
    return {
      removed: this.saved.removed,
      busy: this.busy,
      active: info(this.active),
      candidate: info(this.candidate),
      error: this.error,
      updateError: this.updateError,
    }
  }
  private async serve(): Promise<void> {
    if (this.server) return
    this.server = http.createServer((req, res) => {
      try {
        if (req.method !== 'GET' || req.headers['sec-fetch-dest'] === 'document') {
          res.writeHead(403)
          return res.end()
        }
        const u = new URL(req.url || '/', 'http://127.0.0.1')
        const parts = decodeURIComponent(u.pathname).split('/')
        const id = parts[2],
          entry = this.resolve(id)
        if (parts[1] !== this.secret || !entry) {
          res.writeHead(404)
          return res.end()
        }
        const relative = parts.slice(3).join('/')
        if (!relative || relative.includes('\\') || relative.split('/').some((p) => !p || p === '.' || p === '..'))
          throw new Error('Invalid asset')
        const root = path.join(this.releases, id),
          file = fs.realpathSync(path.join(root, relative)),
          rel = path.relative(fs.realpathSync(root), file)
        if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.statSync(file).isFile())
          throw new Error('Invalid asset')
        const types: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.woff2': 'font/woff2',
        }
        const type = types[path.extname(file)]
        if (!type) throw new Error('Unsupported asset')
        res.writeHead(200, {
          'Content-Type': type,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
          'Content-Security-Policy': `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src ${this.cloudURL}; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'; sandbox allow-scripts`,
        })
        fs.createReadStream(file)
          .on('error', () => res.destroy())
          .pipe(res)
      } catch {
        res.writeHead(404)
        res.end()
      }
    })
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject)
      this.server!.listen(0, '127.0.0.1', resolve)
    })
    this.origin = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
  }
  resolve(id: string): CloudRelease | null {
    const release = [this.active, this.candidate].find((x) => x && x.id === id)
    return release ? { ...release } : null
  }
  async enter(explicit = false): Promise<ExtensionSnapshot> {
    if (this.saved.removed && !explicit) return this.snapshot()
    if (explicit) {
      this.saved.removed = false
      this.persist()
    }
    await this.serve()
    if (!this.active && this.saved.active) {
      try {
        const m = inspect(path.join(this.releases, this.saved.active.id))
        this.candidate = { id: this.saved.active.id, version: m.version }
        this.arm()
      } catch (error) {
        logCloudFailure('cached manifest', error)
        this.saved.active = null
        this.persist()
      }
    }
    this.emit('change')
    if (this.candidate || this.busy) return this.snapshot()
    if (!this.active || this.now() - this.lastCheck >= this.checkInterval) this.check()
    return this.snapshot()
  }
  check(): void {
    if (this.busy || this.saved.removed || this.candidate) return
    this.busy = true
    this.emit('change')
    this.error = null
    this.lastCheck = this.now()
    const run = this.epoch,
      abort = new AbortController()
    this.abort = abort
    this.job = this.download(run, abort.signal)
      .catch((e) => {
        if (run !== this.epoch) return
        logCloudFailure('download', e)
        if (this.active) this.updateError = cloudIssue(e, 'DOWNLOAD_FAILED')
        else this.error = cloudIssue(e, 'DOWNLOAD_FAILED')
      })
      .finally(() => {
        if (run === this.epoch) {
          this.busy = false
          this.abort = null
          this.emit('change')
        }
      })
  }
  private async download(run: number, signal: AbortSignal): Promise<void> {
    const combined = AbortSignal.any([signal, AbortSignal.timeout(30000)])
    const catalog = JSON.parse((await boundedFetch(this.catalogURL, 256 * 1024, combined)).toString('utf8'))
    if (catalog.schema !== 1 || !Array.isArray(catalog.releases) || catalog.releases.length > 100)
      throw new CloudError('PACKAGE_INVALID')
    const compatible = catalog.releases
      .filter((r: CatalogRelease) => {
        try {
          releaseVersion(r.version)
          return r.id === 'emqx.cloud' && r.apiVersion === 1
        } catch {
          return false
        }
      })
      .sort((a: CatalogRelease, b: CatalogRelease) => compareVersions(b.version, a.version))
    const release = compatible[0]
    if (!release) throw new CloudError('NO_COMPATIBLE_VERSION')
    if (this.rejected.has(release.version)) return
    if (this.active && !newer(release.version, this.active.version)) return
    if (!/^[a-f0-9]{64}$/.test(release.sha256)) throw new CloudError('PACKAGE_INVALID')
    const url = remoteURL(release.url)
    const local = remoteURL(this.catalogURL).hostname === '127.0.0.1' && url.hostname === '127.0.0.1'
    if (!local || this.publicKey) {
      const payload = JSON.stringify({
        id: release.id,
        version: release.version,
        apiVersion: release.apiVersion,
        url: release.url,
        sha256: release.sha256,
      })
      if (
        !this.publicKey ||
        !release.signature ||
        !verify(null, Buffer.from(payload), this.publicKey, Buffer.from(release.signature, 'base64'))
      )
        throw new CloudError('SIGNATURE_INVALID')
    }
    const bytes = await boundedFetch(url.href, 20 * 1024 * 1024, combined)
    if (run !== this.epoch) return
    await fs.promises.mkdir(this.releases, { recursive: true })
    const id = `r-${randomUUID()}`,
      directory = path.join(this.releases, id)
    try {
      const manifest = await installCloudPackage(
        { bytes, directory, hash: release.sha256, version: release.version },
        combined,
        this.installWorkerPath,
      )
      if (run !== this.epoch) {
        await fs.promises.rm(directory, { recursive: true, force: true })
        return
      }
      this.candidate = { id, version: manifest.version }
      this.arm()
      this.emit('change')
    } catch (error) {
      await fs.promises.rm(directory, { recursive: true, force: true })
      throw error
    }
  }
  private arm(): void {
    clearTimeout(this.timer)
    // Start readiness timeout only when a renderer actually mounts the page.
    this.mountStarted = false
  }
  mounting(id: string): void {
    if (!this.candidate || this.candidate.id !== id || this.mountStarted) return
    this.mountStarted = true
    this.timer = setTimeout(() => this.failed(id, cloudIssue(new CloudError('PAGE_START_TIMEOUT'))), this.readyTimeout)
  }
  unmount(id: string): void {
    if (this.candidate && this.candidate.id === id) {
      clearTimeout(this.timer)
      this.mountStarted = false
    }
  }
  ready(id: string): ExtensionSnapshot {
    if (!this.candidate || this.candidate.id !== id || this.saved.removed) {
      if (this.isActive(id) && this.now() - this.lastCheck >= this.checkInterval) this.check()
      return this.snapshot()
    }
    clearTimeout(this.timer)
    const candidate = this.candidate
    const next = { removed: false, active: { ...candidate } }
    atomicJSON(this.statePath, next)
    this.saved = next
    this.active = candidate
    this.candidate = null
    this.error = null
    this.updateError = null
    // Keep previous files until renderer has removed its old frame, then garbage collect on next launch/removal.
    this.emit('change')
    if (this.now() - this.lastCheck >= this.checkInterval) this.check()
    return this.snapshot()
  }
  failed(id: string, message: CloudIssue): ExtensionSnapshot {
    if (!this.candidate || this.candidate.id !== id) return this.snapshot()
    clearTimeout(this.timer)
    this.rejected.add(this.candidate.version)
    const dir = path.join(this.releases, id)
    this.candidate = null
    if (this.saved.active && this.saved.active.id === id) {
      this.saved.active = null
      this.persist()
    }
    void fs.promises
      .rm(dir, { recursive: true, force: true })
      .catch((error) => logCloudFailure('discard release', error))
    if (this.active) this.updateError = message
    else this.error = message
    this.emit('change')
    return this.snapshot()
  }
  async remove(): Promise<ExtensionSnapshot> {
    this.saved = { removed: true, active: null }
    this.persist()
    this.epoch++
    clearTimeout(this.timer)
    if (this.abort) this.abort.abort()
    this.active = null
    this.candidate = null
    this.busy = false
    this.error = null
    this.updateError = null
    if (this.job) await this.job.catch(() => {})
    await fs.promises.rm(this.releases, { recursive: true, force: true })
    this.emit('change')
    return this.snapshot()
  }
  dispose(): void {
    this.epoch++
    clearTimeout(this.timer)
    if (this.abort) this.abort.abort()
    if (this.server) this.server.close()
  }
}
