import { logCloudFailure } from './diagnostics'
import { CloudError, cloudIssue } from '../../utils/cloudErrors'
import http from 'http'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { AddressInfo } from 'net'
import { cloudCallbackText } from '../../utils/cloudI18n'
import { CloudToken, CredentialVault } from './storage'

import type { CloudSession, CloudSessionStatus, CloudIssue } from '../../types/cloud'
interface AuthOptions {
  authURL: string
  vault: CredentialVault
  openExternal: (url: string) => Promise<void>
  now?: () => number
  timeout?: number
}

export function origin(value: string): string {
  let u: URL
  try {
    u = new URL(value)
  } catch {
    throw new CloudError('INVALID_SERVICE_URL')
  }
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.pathname !== '/' ||
    !(u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === '127.0.0.1'))
  )
    throw new CloudError('INVALID_SERVICE_URL')
  return u.origin
}
export class CloudAuth {
  private readonly authURL: string
  private readonly vault: CredentialVault
  private readonly openExternal: (url: string) => Promise<void>
  private readonly now: () => number
  private readonly timeout: number
  private expiryTimer: ReturnType<typeof setTimeout> | undefined
  private token: CloudToken | null
  private pending: { cancel: () => void } | null
  generation: number
  private loaded: boolean
  private status: CloudSessionStatus
  private message: CloudIssue | null
  private stateListeners = new Set<() => void>()
  constructor({ authURL, vault, openExternal, now = Date.now, timeout = 300000 }: AuthOptions) {
    this.authURL = origin(authURL)
    this.vault = vault
    this.openExternal = openExternal
    this.now = now
    this.timeout = timeout
    this.token = null
    this.pending = null
    this.generation = 0
    this.loaded = false
    this.status = 'signed-out'
    this.message = null
  }
  state(): CloudSession {
    if (!this.loaded) {
      try {
        this.token = this.vault.load()
        this.loaded = true
        if (this.token) {
          this.status = 'signed-in'
          this.scheduleExpiry()
          this.notify()
        }
        this.message = null
      } catch (e) {
        this.message = cloudIssue(e)
      }
    }
    if (this.token && this.token.expiresAt <= this.now()) this.invalidate(cloudIssue(new CloudError('AUTH_EXPIRED')))
    return { status: this.status, message: this.message, expiresAt: this.token ? this.token.expiresAt : null }
  }
  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer)
    if (!this.token) return
    // Node timers support at most 2^31-1 ms; longer token lifetimes need another timer.
    this.expiryTimer = setTimeout(() => {
      if (this.token && this.token.expiresAt <= this.now()) {
        try {
          this.invalidate(cloudIssue(new CloudError('AUTH_EXPIRED')))
        } catch (error) {
          logCloudFailure('session expiry', error)
        }
      } else this.scheduleExpiry()
    }, Math.min(Math.max(0, this.token.expiresAt - this.now()), 2147483647))
    this.expiryTimer.unref()
  }
  invalidate(message: CloudIssue | null = null): void {
    clearTimeout(this.expiryTimer)
    this.generation++
    this.token = null
    this.loaded = true
    this.status = message ? 'expired' : 'signed-out'
    this.message = message
    if (this.pending) this.pending.cancel()
    try {
      this.vault.clear()
    } finally {
      this.notify()
    }
  }
  async login(locale = 'en'): Promise<CloudSession> {
    if (this.pending) throw new CloudError('AUTH_PENDING')
    this.invalidate()
    this.status = 'authorizing'
    this.message = cloudIssue(new CloudError('AUTH_BROWSER_REQUIRED'))
    this.notify()
    const run = this.generation
    let verifier = randomBytes(32).toString('base64url'),
      expectedState = randomBytes(32).toString('base64url')
    let redirectURI = ''
    let timer: ReturnType<typeof setTimeout> | undefined
    let settled = false
    let settle!: (error?: Error) => void
    const abort = new AbortController()
    const outcome = new Promise<void>((resolve, reject) => {
      settle = (error) => {
        if (settled) return
        settled = true
        error ? reject(error) : resolve()
      }
    })
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      const reply = (status: number, code: string) => {
        res.writeHead(status, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
          'Content-Security-Policy': "default-src 'none'",
        })
        res.end(cloudCallbackText(code, locale))
      }
      if (req.method !== 'GET' || url.pathname !== '/oauth/callback') return reply(404, 'OPERATION_DENIED')
      const received = url.searchParams.get('state') || ''
      if (
        !expectedState ||
        Buffer.byteLength(received) !== Buffer.byteLength(expectedState) ||
        !timingSafeEqual(Buffer.from(received), Buffer.from(expectedState))
      )
        return reply(400, 'AUTH_CALLBACK_INVALID')
      if (settled || this.status !== 'authorizing' || run !== this.generation)
        return reply(409, 'AUTH_CALLBACK_HANDLED')
      if (url.searchParams.has('error')) {
        reply(200, 'AUTH_CANCELLED')
        return settle(new CloudError('AUTH_CANCELLED'))
      }
      const code = url.searchParams.get('code')
      if (!code) {
        reply(400, 'AUTH_CODE_MISSING')
        return settle(new CloudError('AUTH_CODE_MISSING'))
      }
      this.status = 'exchanging'
      this.notify()
      reply(200, 'AUTH_COMPLETE')
      server.close()
      try {
        const response = await fetch(`${this.authURL}/api/v2/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          redirect: 'error',
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'mqttx',
            code,
            redirect_uri: redirectURI,
            code_verifier: verifier,
          }),
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
        })
        const data = await response.json()
        if (
          !response.ok ||
          typeof data.access_token !== 'string' ||
          !data.access_token ||
          data.access_token.length > 16384 ||
          /[\r\n]/.test(data.access_token) ||
          data.token_type !== 'Bearer' ||
          !Number.isFinite(data.expires_in) ||
          data.expires_in <= 0 ||
          data.expires_in > 31536000 ||
          data.scope !== 'deployments:read'
        )
          throw new CloudError('AUTH_RESULT_INVALID')
        if (run !== this.generation) throw new CloudError('AUTH_CANCELLED')
        const token = { value: data.access_token, expiresAt: this.now() + data.expires_in * 1000 }
        this.vault.save(token)
        this.token = token
        this.status = 'signed-in'
        this.scheduleExpiry()
        this.message = null
        this.notify()
        settle()
      } catch (e) {
        settle(e as Error)
      }
    })
    this.pending = {
      cancel: () => {
        abort.abort()
        settle(new CloudError('AUTH_CANCELLED'))
      },
    }
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      redirectURI = `http://127.0.0.1:${(server.address() as AddressInfo).port}/oauth/callback`
      const url = new URL(`${this.authURL}/oauth/authorize`)
      url.search = new URLSearchParams({
        response_type: 'code',
        client_id: 'mqttx',
        scope: 'deployments:read',
        redirect_uri: redirectURI,
        state: expectedState,
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        code_challenge_method: 'S256',
      }).toString()
      timer = setTimeout(() => settle(new CloudError('AUTH_TIMEOUT')), this.timeout)
      Promise.resolve()
        .then(() => this.openExternal(url.href))
        .catch(() => settle(new CloudError('BROWSER_OPEN_FAILED')))
      await outcome
    } catch (e) {
      outcome.catch(() => {})
      if (run === this.generation) {
        this.status = 'signed-out'
        this.message = cloudIssue(e)
        this.notify()
      }
    } finally {
      clearTimeout(timer)
      abort.abort()
      server.close()
      verifier = ''
      expectedState = ''
      this.pending = null
    }
    return this.state()
  }
  private notify(): void {
    for (const listener of this.stateListeners) listener()
  }
  subscribeState(listener: () => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }
  credential(): CloudToken & { generation: number } {
    if (this.state().status !== 'signed-in' || !this.token) throw new CloudError('LOGIN_REQUIRED')
    return { ...this.token, generation: this.generation }
  }
  validate(generation: number): boolean {
    return this.state().status === 'signed-in' && generation === this.generation
  }
  reject(generation: number): CloudSession {
    if (this.validate(generation)) this.invalidate(cloudIssue(new CloudError('AUTH_REJECTED')))
    return this.state()
  }
  dispose(): void {
    clearTimeout(this.expiryTimer)
    this.generation++
    if (this.pending) this.pending.cancel()
    this.stateListeners.clear()
    this.token = null
  }
}
