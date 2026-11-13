// 内部诊断日志：排查会话过期等处理失败的原因，不把原始异常直接显示给用户。
import { logCloudFailure } from './diagnostics'
// CloudError 表示带错误码的异常；cloudIssue 把异常整理为可翻译的错误结构。
import { CloudError, cloudIssue } from '../../utils/cloudErrors'
// Node.js HTTP 模块，用来临时监听浏览器授权后的本机回调。
import http from 'http'
import version from '../../version'
// 分别用于生成随机值、计算 PKCE 摘要，以及用恒定时间比较 state，减少比较耗时泄露信息。
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
// 服务器地址的类型，读取系统分配的监听端口时使用。
import { AddressInfo } from 'net'
// 根据结果码和发起登录时的语言，生成浏览器回调页面的提示文案。
import { cloudCallbackText } from '../../utils/cloudI18n'
// CloudToken 是内存凭据结构；CredentialVault 是保存、恢复、清理本机凭据的接口。
import { CloudToken, CredentialVault } from './storage'

// 会话快照、会话状态和错误信息的共享类型。
import type { CloudSession, CloudSessionStatus, CloudIssue } from '../../types/cloud'
// 创建认证实例所需的配置；? 表示可省略，由构造函数使用默认值。
interface AuthOptions {
  // Auth Center 的服务地址，不包含具体接口路径。
  authURL: string
  // 凭据存储实例，认证模块通过它读写会话，而不是自行实现加密和文件处理。
  vault: CredentialVault
  getDeviceId: () => Promise<string>
  // 打开系统浏览器的函数；url 是要访问的授权地址。
  openExternal: (url: string) => Promise<void>
  // 取得当前毫秒时间戳的函数，测试可以传入可控制的时钟。
  now?: () => number
  // 一次登录允许等待的总时长，单位为毫秒。
  timeout?: number
}

// 校验服务配置 value，并返回 origin（协议、主机、端口），例如 https://auth.example.com。
export function origin(value: string): string {
  // u 保存解析后的 URL，便于分别检查账号信息、路径、协议等部分。
  let u: URL
  try {
    u = new URL(value)
  } catch {
    throw new CloudError('INVALID_SERVICE_URL')
  }
  // 服务配置不能夹带账号密码、查询参数、片段或业务路径。
  // 正式地址要求 HTTPS；本地调研仅允许 127.0.0.1 的 HTTP 地址。
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
// MQTTX 主进程的认证管理器：负责会话恢复、浏览器授权、token 保存与失效。
export class CloudAuth {
  // 已校验的 Auth Center 地址；readonly 表示构造完成后不再重新赋值。
  private readonly authURL: string
  // 凭据存储接口，实际实现负责加密保存。
  private readonly vault: CredentialVault
  private readonly getDeviceId: () => Promise<string>
  // 由宿主传入的浏览器打开函数。
  private readonly openExternal: (url: string) => Promise<void>
  // 当前时间的获取函数，而不是一个固定时间值。
  private readonly now: () => number
  // 登录的总等待上限，与下面 token 请求的 10 秒超时是两回事。
  private readonly timeout: number
  // token 到期计时器句柄；退出或重新安排时需要取消旧计时器。
  private expiryTimer: ReturnType<typeof setTimeout> | undefined
  // 当前内存中的 token 及其到期时间；null 表示没有可用凭据。
  private token: CloudToken | null
  // 当前进行中的登录任务，只暴露取消入口；null 表示没有登录任务。
  private pending: { cancel: () => void } | null
  // 会话代次：每次清理会话时递增，让旧登录任务和旧业务请求的结果失效。
  generation: number
  // 是否已成功尝试恢复本机会话；避免每次查询状态都读取磁盘。
  private loaded: boolean
  // 当前认证阶段，例如 signed-out、authorizing、exchanging、signed-in、expired。
  private status: CloudSessionStatus
  // 当前提示或错误，以错误码和参数保存，显示时再翻译；null 表示无提示。
  private message: CloudIssue | null
  // 订阅状态变化的回调集合；Set 避免同一个函数重复登记。
  private stateListeners = new Set<() => void>()
  // 解构配置对象并保存依赖；默认使用真实时钟，登录最多等待 300000 毫秒（5 分钟）。
  constructor({ authURL, vault, openExternal, getDeviceId, now = Date.now, timeout = 300000 }: AuthOptions) {
    this.authURL = origin(authURL)
    this.vault = vault
    this.getDeviceId = getDeviceId
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
  // 返回不包含 token 的会话快照；首次查询时从本机恢复，并检查凭据是否已到期。
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
        // e 是存储读取或恢复过程的异常；未成功加载时保留重试读取的机会。
        this.message = cloudIssue(e)
      }
    }
    if (this.token && this.token.expiresAt <= this.now()) this.invalidate(cloudIssue(new CloudError('AUTH_EXPIRED')))
    return { status: this.status, message: this.message, expiresAt: this.token ? this.token.expiresAt : null }
  }
  // 按 token 到期时间安排通知，避免只有用户再次操作时才发现过期。
  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer)
    if (!this.token) return
    // Node 计时器最多支持 2^31-1 毫秒；有效期更长时先等一段，再安排下一次检查。
    this.expiryTimer = setTimeout(() => {
      if (this.token && this.token.expiresAt <= this.now()) {
        try {
          this.invalidate(cloudIssue(new CloudError('AUTH_EXPIRED')))
        } catch (error) {
          logCloudFailure('session expiry', error)
        }
      } else this.scheduleExpiry()
    }, Math.min(Math.max(0, this.token.expiresAt - this.now()), 2147483647))
    // unref 让这个计时器本身不会阻止 Node 事件循环结束。
    this.expiryTimer.unref()
  }
  // 清理当前会话，也取消尚未结束的登录。message 非空时标记为 expired，否则为 signed-out。
  invalidate(message: CloudIssue | null = null): void {
    clearTimeout(this.expiryTimer)
    this.generation++
    this.token = null
    // 这里的 loaded=true 表示不再尝试从磁盘恢复刚被清除的旧会话。
    this.loaded = true
    this.status = message ? 'expired' : 'signed-out'
    this.message = message
    if (this.pending) this.pending.cancel()
    try {
      this.vault.clear()
    } finally {
      // 即使本机凭据删除失败，内存会话已经失效，也必须通知页面更新状态。
      this.notify()
    }
  }
  // 发起完整登录流程；locale 决定浏览器回调提示的语言，返回最终的会话快照。
  // 此方法会异步等待浏览器回调或失败结果，但不会阻塞整个主进程。
  async login(locale = 'en'): Promise<CloudSession> {
    // 同一时间只允许一个登录任务，防止回调和凭据混用。
    if (this.pending) throw new CloudError('AUTH_PENDING')
    this.invalidate()
    this.status = 'authorizing'
    this.message = cloudIssue(new CloudError('AUTH_BROWSER_REQUIRED'))
    this.notify()
    // run 记录本次登录开始时的会话代次，之后用来识别取消、退出导致的旧结果。
    const run = this.generation
    // verifier 是 PKCE 的随机秘密：只把它的 SHA-256 摘要放进浏览器授权地址，换 token 时才提交原值。
    // expectedState 是本次授权的随机标识，用来检查浏览器回调是否对应这次登录。
    let verifier = randomBytes(32).toString('base64url'),
      expectedState = randomBytes(32).toString('base64url')
    // 回调地址要等服务器监听成功、拿到实际端口后才能确定。
    let redirectURI = ''
    // 整次登录等待的超时计时器，与会话到期计时器 expiryTimer 区分。
    let timer: ReturnType<typeof setTimeout> | undefined
    // outcome 是否已经结束，防止成功、取消、超时同时尝试完成同一个任务。
    let settled = false
    // 结束登录等待的函数；! 表示稍后一定会赋值，? 表示 error 可以不传。
    let settle!: (error?: Error) => void
    // 取消控制器，取消登录或收尾时中止正在进行的 token HTTP 请求。
    const abort = new AbortController()
    // outcome 代表登录任务完成的结果；resolve 表示成功，reject 表示失败。
    const outcome = new Promise<void>((resolve, reject) => {
      settle = (error) => {
        if (settled) return
        settled = true
        error ? reject(error) : resolve()
      }
    })
    // 认证专用的临时 HTTP 服务，和提供插件页面文件的资源服务是两个独立服务。
    // req 是浏览器发来的请求，res 用来向浏览器回复；这个异步函数就是登录回调处理函数。
    const server = http.createServer(async (req, res) => {
      // 将请求路径和查询参数解析出来，方便获取 state、code、error。
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      // 回复浏览器的辅助函数：status 是 HTTP 状态码，code 是提示文案的键，不是 OAuth 授权码。
      const reply = (status: number, code: string) => {
        res.writeHead(status, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
          'Content-Security-Policy': "default-src 'none'",
        })
        res.end(cloudCallbackText(code, locale))
      }
      // 只接收约定路径的 GET 回调，其他请求不参与授权处理。
      if (req.method !== 'GET' || url.pathname !== '/mqttx/callback') return reply(404, 'OPERATION_DENIED')
      // received 是回调带回的 state，必须与发起授权时的 expectedState 相同。
      const received = url.searchParams.get('state') || ''
      // timingSafeEqual 要求两个 Buffer 长度相同，所以先检查长度，再比较内容。
      if (
        !expectedState ||
        Buffer.byteLength(received) !== Buffer.byteLength(expectedState) ||
        !timingSafeEqual(Buffer.from(received), Buffer.from(expectedState))
      )
        return reply(400, 'AUTH_CALLBACK_INVALID')
      // 已处理、已取消，或会话代次已变化的回调，不能继续换取 token。
      if (settled || this.status !== 'authorizing' || run !== this.generation)
        return reply(409, 'AUTH_CALLBACK_HANDLED')
      // Auth Center 返回 error 参数表示授权没有成功，这里按取消授权结束等待。
      if (url.searchParams.has('error')) {
        reply(200, 'AUTH_CANCELLED')
        return settle(new CloudError('AUTH_CANCELLED'))
      }
      // 这里的 code 才是 OAuth 授权码：它不是 token，还需要提交给 Auth Center 兑换。
      const code = url.searchParams.get('code')
      if (!code) {
        reply(400, 'AUTH_CODE_MISSING')
        return settle(new CloudError('AUTH_CODE_MISSING'))
      }
      // 从“等用户授权”切换为“正在换取 token”，页面收到通知后更新等待状态。
      this.status = 'exchanging'
      this.notify()
      // 浏览器此时收到提示，但 token 兑换尚未结束；真正 signed-in 要等下面成功。
      reply(200, 'AUTH_COMPLETE')
      // 停止接受新的回调连接，本次函数仍会继续处理 token 请求。
      server.close()
      try {
        // response 是 Auth Center 的 HTTP 响应；用授权码和 PKCE 原值兑换 token。
        const response = await fetch(`${this.authURL}/api/v2/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': `MQTTX/${version} (${process.platform}; ${process.arch})`,
          },
          // 禁止跟随重定向，避免把认证请求自动转发到其他地址。
          redirect: 'error',
          // 将字段编码为表单；redirect_uri 必须与发起授权时一致。
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'mqttx',
            code,
            redirect_uri: redirectURI,
            code_verifier: verifier,
          }),
          // 用户取消或请求超过 10 秒，任意一个条件发生都中止这次 HTTP 请求。
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
        })
        // data 是服务端返回的 JSON，属于外部输入，必须检查后才能使用。
        const data = await response.json()
        // 检查 HTTP 成功、token 格式和长度、Bearer 类型、有效期，以及只读部署权限。
        // expires_in 的单位是秒，限定在大于 0 且不超过 365 天；换行符不能进入请求头。
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
        // token 请求期间可能已退出或取消，旧任务的结果不能保存为当前会话。
        if (run !== this.generation) throw new CloudError('AUTH_CANCELLED')
        // token 是应用内部使用的凭据对象；把相对有效秒数换算成绝对毫秒时间戳。
        const token = { value: data.access_token, expiresAt: this.now() + data.expires_in * 1000 }
        // 先确认安全存储成功，再更新内存状态，避免显示已登录但无法持久化。
        this.vault.save(token)
        this.token = token
        this.status = 'signed-in'
        this.scheduleExpiry()
        this.message = null
        // 通知页面切换到已登录，然后让下方 await outcome 结束等待。
        this.notify()
        settle()
      } catch (e) {
        // 将兑换、校验或保存失败交给 outcome，统一进入 login 外层的失败与清理流程。
        settle(e as Error)
      }
    })
    // 保存取消入口，供 invalidate 或 dispose 调用；取消会同时中止请求和结束等待。
    this.pending = {
      cancel: () => {
        abort.abort()
        settle(new CloudError('AUTH_CANCELLED'))
      },
    }
    try {
      // 等待超时后主动结束 outcome；不会无限等用户在浏览器中操作。
      timer = setTimeout(() => settle(new CloudError('AUTH_TIMEOUT')), this.timeout)
      const deviceID = await Promise.race([
        this.getDeviceId(),
        outcome.then(() => {
          throw new CloudError('AUTH_CANCELLED')
        }),
      ])
      if (settled || run !== this.generation) throw new CloudError('AUTH_CANCELLED')
      // 等监听成功再打开浏览器；端口 0 表示由系统选择一个可用端口，只绑定本机回环地址。
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      if (settled || run !== this.generation) throw new CloudError('AUTH_CANCELLED')
      // AddressInfo 是类型断言，用实际分配的端口组成浏览器授权完成后的跳转地址。
      redirectURI = `http://127.0.0.1:${(server.address() as AddressInfo).port}/mqttx/callback`
      // 这个 url 是浏览器要打开的 Auth Center 地址，与回调函数里的本机请求 url 不同。
      const url = new URL(`${this.authURL}/oauth/authorize`)
      // 把授权参数编码进查询字符串；传入 PKCE 摘要，保留 verifier 原值在主进程内存。
      url.search = new URLSearchParams({
        response_type: 'code',
        client_id: 'mqttx',
        device_id: deviceID,
        scope: 'deployments:read',
        redirect_uri: redirectURI,
        state: expectedState,
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        code_challenge_method: 'S256',
      }).toString()
      // 打开浏览器时的异常也汇入 outcome；浏览器打开成功本身不代表用户已授权。
      Promise.resolve()
        .then(() => this.openExternal(url.href))
        .catch(() => settle(new CloudError('BROWSER_OPEN_FAILED')))
      // 等待回调处理成功、失败、取消或超时；这就是“等待浏览器登录”的核心位置。
      await outcome
    } catch (e) {
      // 若监听启动阶段就失败，可能还未执行到 await outcome；处理它之后可能产生的拒绝。
      outcome.catch(() => {})
      // 只允许本次任务更新本次会话，避免覆盖取消或退出操作已经设置的状态。
      if (run === this.generation) {
        this.status = 'signed-out'
        this.message = cloudIssue(e)
        this.notify()
      }
    } finally {
      // 无论结果如何，都释放计时器、网络请求和回调服务，并清除本次随机值的引用。
      clearTimeout(timer)
      abort.abort()
      server.close()
      verifier = ''
      expectedState = ''
      this.pending = null
    }
    // 返回最终快照；失败通常通过 message 和 status 表达，供页面展示。
    return this.state()
  }
  // 通知所有状态订阅者重新读取状态；listener 是其中一个无参数回调。
  private notify(): void {
    for (const listener of this.stateListeners) listener()
  }
  // 注册订阅者，返回取消订阅函数；调用方释放资源时用同一个 listener 从 Set 中移除。
  subscribeState(listener: () => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }
  // 给受控调用路径提供有效 token 和会话代次；与不含 token 的 state() 区分。
  // & 表示返回值既包含 CloudToken 的字段，又包含 generation 字段。
  credential(): CloudToken & { generation: number } {
    if (this.state().status !== 'signed-in' || !this.token) throw new CloudError('LOGIN_REQUIRED')
    return { ...this.token, generation: this.generation }
  }
  // generation 是请求发起时拿到的代次；登录仍有效且代次一致，结果才属于当前会话。
  validate(generation: number): boolean {
    return this.state().status === 'signed-in' && generation === this.generation
  }
  // 服务端拒绝 token 后调用；只清理同一代会话，旧请求不能使新登录失效。
  reject(generation: number): CloudSession {
    if (this.validate(generation)) this.invalidate(cloudIssue(new CloudError('AUTH_REJECTED')))
    return this.state()
  }
  // 应用退出时释放认证资源；不清除本机已保存的会话，以便下次启动恢复。
  dispose(): void {
    clearTimeout(this.expiryTimer)
    this.generation++
    if (this.pending) this.pending.cancel()
    this.stateListeners.clear()
    this.token = null
  }
}
