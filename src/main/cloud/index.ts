// CloudError 用于抛出带错误码的异常；cloudIssue 把异常转换成可发给页面的错误结构。
import { CloudError, cloudIssue } from '../../utils/cloudErrors'
// app 管理应用生命周期和数据目录；ipcMain 接收页面请求；safeStorage 加密凭据；shell 打开浏览器。
import { app, ipcMain, safeStorage, shell } from 'electron'
// WebContents 表示窗口中的网页内容，主进程通过它识别请求者并向页面发送消息。
import type { WebContents } from 'electron'
// Node.js 的路径工具，用于拼接本机目录。
import path from 'path'
// 扩展管理器：负责下载、校验、安装、启用和移除扩展。
import { CloudExtension } from './extension'
// 凭据存储：负责把加密后的会话保存到本机并恢复。
import { CredentialStore } from './storage'
// CloudAuth 处理登录和会话；origin 校验服务地址并提取“协议 + 主机 + 端口”。
import { CloudAuth, origin } from './auth'
import { CloudDeviceIdentity } from './device'
// 检查从页面收到的操作名和参数，不能仅依赖 TypeScript 的编译期类型。
import { parseCloudRequest } from './requests'
// 记录用于排查问题的内部日志，避免记录 token 等敏感信息。
import { logCloudFailure } from './diagnostics'
// 主进程和页面共享的通信类型，只在类型检查时使用。
import type { CloudMethod, CloudParams, CloudResults, CloudState, CloudIssue, CloudSession } from '../../types/cloud'

// 操作处理表的类型：[M in CloudMethod] 为每一种 Cloud 操作规定对应函数。
// args 的类型随操作名变化；sender 是发起请求的网页；返回值可以是数据或异步 Promise。
type Handlers = {
  [M in CloudMethod]: (args: CloudParams[M], sender: WebContents) => CloudResults[M] | Promise<CloudResults[M]>
}
// 统一调用入口的函数类型。M 是本次操作名，参数和返回值都与 M 对应。
type CloudInvoke = <M extends CloudMethod>(
  method: M,
  args: CloudParams[M],
  sender: WebContents,
) => Promise<CloudResults[M]>

// 应用启动时调用：创建 Cloud 服务，并注册页面调用的 cloud:invoke IPC 入口。
// environment 默认取进程环境变量，测试也可以直接传入一份配置。
export function initializeCloud(
  environment: NodeJS.ProcessEnv = {
    // ... 表示展开对象，把已有环境变量复制进来。
    ...process.env,
    // webpack 只有看到直接引用才会注入开发服务器地址，因此需要单独保留这一项。
    WEBPACK_DEV_SERVER_URL: process.env.WEBPACK_DEV_SERVER_URL,
  },
): void {
  // 成功初始化后保存统一调用函数；失败时保持 undefined，普通 MQTT 功能仍可启动。
  let invoke: CloudInvoke | undefined
  // 保存初始化失败的错误，后续页面请求 Cloud 时可以得到明确提示。
  let failure: CloudIssue | undefined
  try {
    invoke = createCloudRuntime(environment)
  } catch (error) {
    logCloudFailure('initialization', error)
    failure = cloudIssue(error)
  }
  // 与渲染侧 ipcRenderer.invoke('cloud:invoke', method, args) 配套。
  // event 由 Electron 提供；method、args 来自页面，先用 unknown 表示尚未校验。
  ipcMain.handle('cloud:invoke', async (event, method: unknown, args: unknown = {}) => {
    try {
      // frame 是具体发起请求的页面框架；窗口主页面和它嵌入的 iframe 是不同的 frame。
      const frame = event.senderFrame
      // 将来源地址解析成 URL 对象；没有来源时用 about:blank，后面的检查会拒绝它。
      const url = new URL(frame?.url || 'about:blank')
      // 开发环境允许来自宿主开发服务器的请求；打包后的应用不开放这个入口条件。
      const development =
        !app.isPackaged &&
        environment.WEBPACK_DEV_SERVER_URL &&
        url.origin === new URL(environment.WEBPACK_DEV_SERVER_URL).origin
      // 打包后的 MQTTX 页面使用 app://./index.html，只允许这个本地入口。
      const local = url.protocol === 'app:' && url.hostname === '.' && url.pathname === '/index.html'
      // 同时检查“是否为窗口主页面”和“地址是否允许”，防止子 iframe 直接调用主进程接口。
      if (frame !== event.sender.mainFrame || !(development || local)) throw new CloudError('OPERATION_DENIED')
      // request 是校验后的操作名和参数，拒绝未声明的方法或格式不正确的参数。
      const request = parseCloudRequest(method, args)
      // 初始化失败时只返回 Cloud 错误，不执行后续操作。
      if (!invoke) return { ok: false, error: failure }
      // await 等待具体操作结束，return 的对象会作为 invoke 的结果传回页面。
      return { ok: true, data: await invoke(request.method, request.args, event.sender) }
    } catch (error) {
      // 详细诊断留在内部日志，对外只传错误码和参数，由页面负责翻译。
      logCloudFailure('host request', error)
      return { ok: false, error: cloudIssue(error) }
    }
  })
}

// 创建这一轮应用运行期间共用的认证、扩展管理和状态通知逻辑，返回统一调用函数。
// 下面的内部函数共享这些变量；这叫闭包，页面每次调用不会重新创建一套服务。
function createCloudRuntime(environment: NodeJS.ProcessEnv): CloudInvoke {
  // 认证服务地址，用来登录和换取 token；未配置时使用本地调研服务。
  const authURL = origin(environment.MQTTX_CLOUD_AUTH_URL || 'http://127.0.0.1:43110')
  // Cloud API 地址，会随凭据交给扩展；MQTTX 不在这里发送 Cloud 业务请求。
  const cloudURL = origin(environment.MQTTX_CLOUD_API_URL || 'http://127.0.0.1:43111')
  // 扩展开发服务器地址：仅在未打包且宿主开发服务器存在时读取。
  const developmentOrigin =
    !app.isPackaged && environment.WEBPACK_DEV_SERVER_URL && environment.MQTTX_CLOUD_DEV_URL
      ? origin(environment.MQTTX_CLOUD_DEV_URL)
      : undefined
  // 开发页面只接受本机 127.0.0.1 的 HTTP 服务，避免误加载任意远程页面。
  if (
    developmentOrigin &&
    (!developmentOrigin.startsWith('http:') || new URL(developmentOrigin).hostname !== '127.0.0.1')
  )
    throw new CloudError('INVALID_SERVICE_URL')
  // Cloud 的本机数据根目录，位于 Electron 为当前应用提供的用户数据目录中。
  const root = path.join(app.getPath('userData'), 'cloud')
  // vault 是凭据存储实例；把服务地址绑定到会话，避免切换环境后复用旧 token。
  const vault = new CredentialStore(root, safeStorage, JSON.stringify({ authURL, cloudURL, client: 'mqttx' }))
  const deviceIdentity = new CloudDeviceIdentity(path.join(root, 'device.json'))
  // auth 是认证实例；openExternal 回调让认证流程通过系统浏览器打开授权地址。
  const auth = new CloudAuth({
    authURL,
    vault,
    getDeviceId: () => deviceIdentity.get(),
    openExternal: (url) => shell.openExternal(url),
  })
  // extension 是扩展管理实例；构造时传入运行配置，不代表立即开始下载。
  const extension = new CloudExtension({
    // 开发模式加载 Vite 的页面，正常模式则使用已下载的扩展包。
    developmentURL: developmentOrigin ? `${developmentOrigin}/dev.html` : undefined,
    cloudURL,
    root,
    // 扩展版本清单地址，清单中包含可下载版本的信息。
    catalogURL: environment.MQTTX_CLOUD_CATALOG_URL || 'http://127.0.0.1:43112/catalog.json',
    // 发布签名的验证公钥；私钥不放在 MQTTX 中。
    publicKey: environment.MQTTX_CLOUD_PUBLIC_KEY || '',
    // 正常每小时检查一次；显式配置本地清单服务时可缩短间隔，但最低为 2 秒。
    checkInterval: environment.MQTTX_CLOUD_CATALOG_URL?.startsWith('http://127.0.0.1:')
      ? Math.max(2000, Number(environment.MQTTX_CLOUD_UPDATE_INTERVAL_MS) || 3600000)
      : 3600000,
  })
  // removing：是否正在移除；revision：状态递增版本号；queued：是否已安排一次状态推送。
  let removing = false,
    revision = 0,
    queued = false
  // viewers 保存正在查看 Cloud 的网页，Set 自动去重。
  // tracked 记录哪些网页已注册销毁监听；WeakSet 不会仅因记录对象而阻止其被垃圾回收。
  const viewers = new Set<WebContents>(),
    tracked = new WeakSet<WebContents>()
  // 定期检查扩展更新的计时器句柄，只在有 Cloud 查看者时启动。
  let timer: ReturnType<typeof setInterval> | undefined
  // 生成当前状态快照；它包含会话状态和扩展信息，不包含 token。
  const snapshot = (): CloudState => {
    // 扩展已移除时对外显示未登录，否则读取 auth 当前的真实会话状态。
    const session: CloudSession = extension.removed
      ? { status: 'signed-out', message: null, expiresAt: null }
      : auth.state()
    // ... 展开扩展快照，再补上版本号和会话，组成页面需要的完整状态。
    return { ...extension.snapshot(), revision, session }
  }
  // 认证或扩展发生变化时调用：提高版本号，并安排向所有查看者推送最新状态。
  const changed = (): void => {
    revision++
    // 同一轮连续发生多次变化时，只安排一次推送，但版本号仍会递增。
    if (queued) return
    queued = true
    // 微任务会在当前同步代码结束后执行，合并本轮变化；它不会新建进程或线程。
    queueMicrotask(() => {
      // state 是发送当下的完整快照，而不是第一次触发 changed 时的旧状态。
      const state = snapshot()
      queued = false
      // viewer 是一个正在查看 Cloud 的网页；已销毁的网页不能再接收消息。
      for (const viewer of viewers) if (!viewer.isDestroyed()) viewer.send('cloud:state', state)
    })
  }
  // 根据是否有人查看 Cloud，启动或停止更新检查；开发模式不检查扩展包更新。
  const schedule = (): void => {
    if (viewers.size && !timer && !developmentOrigin)
      timer = setInterval(() => extension.check(), extension.checkInterval)
    if (!viewers.size && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
  // 将请求者 sender 登记为 Cloud 查看者，并确保窗口销毁时自动取消登记。
  const watch = (sender: WebContents): void => {
    viewers.add(sender)
    if (!tracked.has(sender)) {
      tracked.add(sender)
      // once 只执行一次；同一网页多次进入 Cloud 也只注册一个销毁回调。
      sender.once('destroyed', () => {
        viewers.delete(sender)
        schedule()
      })
    }
    schedule()
  }
  // 将扩展事件和认证状态变化接到同一个 changed 函数，统一推送给页面。
  extension.on('change', changed)
  auth.subscribeState(changed)
  // id 是扩展运行版本的标识；确认版本仍存在且没有被移除，才能处理它的生命周期通知。
  const requireRelease = (id: string): void => {
    if (!extension.resolve(id) || extension.removed) throw new CloudError('EXTENSION_STOPPED')
  }
  // 认证相关接口要求更严格：除了版本存在，还必须已经启用，候选版本不能取凭据。
  const requireActive = (id: string): void => {
    requireRelease(id)
    if (!extension.isActive(id)) throw new CloudError('NOT_READY')
  }
  // 准备扩展并返回快照；explicit 表示用户明确要求重新添加，而非普通进入页面。
  const prepare = async (sender: WebContents, explicit = false): Promise<CloudState> => {
    watch(sender)
    // 重新添加已移除的扩展时清理会话，避免恢复之前账号的授权状态。
    if (explicit && extension.removed) auth.invalidate()
    await extension.enter(explicit)
    return snapshot()
  }
  // “操作名 -> 处理函数”的对应表，IPC 校验后会按 method 找到这里的函数。
  const handlers: Handlers = {
    // locale 是页面语言；开始浏览器登录授权，操作结束后返回状态。
    login: async ({ locale }) => {
      if (extension.removed) throw new CloudError('EXTENSION_STOPPED')
      await auth.login(locale)
      return snapshot()
    },
    // 退出账号：使当前会话失效并清理凭据。
    logout: () => {
      auth.invalidate()
      return snapshot()
    },
    // 取消正在进行的授权，同样由 auth.invalidate 结束当前认证流程。
    cancel: () => {
      auth.invalidate()
      return snapshot()
    },
    // 只查询状态，不开始下载或登录。
    status: () => snapshot(),
    // _args 表示该操作不使用参数对象；sender 用于登记当前查看者。
    enter: (_args, sender) => prepare(sender),
    // 用户明确添加扩展，因此将 explicit 设为 true。
    add: (_args, sender) => prepare(sender, true),
    // 重新尝试准备扩展，并确保当前页面已订阅后续状态。
    retry: async (_args, sender) => {
      watch(sender)
      await extension.retry()
      return snapshot()
    },
    // 离开 Cloud 页面只取消查看登记，不等于退出账号或移除扩展。
    leave: (_args, sender) => {
      viewers.delete(sender)
      schedule()
    },
    // 移除扩展时同时结束认证；即使凭据清理失败，也继续尝试清理扩展文件。
    remove: async () => {
      removing = true
      try {
        // error 暂存认证清理错误，等扩展清理执行后再抛出；unknown 表示异常可能是任意类型。
        let error: unknown
        try {
          auth.invalidate()
        } catch (cause) {
          // cause 是 auth.invalidate 抛出的原始异常。
          error = cause
        }
        await extension.remove()
        if (error) throw error
        return snapshot()
      } finally {
        // 无论成功还是抛错，都结束“正在移除”的状态，避免后续调用一直被阻止。
        removing = false
      }
    },
    // 宿主准备挂载指定 id 的扩展页面，开始跟踪这次页面启动。
    mounting: ({ id }) => {
      requireRelease(id)
      extension.mounting(id)
      return snapshot()
    },
    // 扩展页面通过消息桥报告就绪；管理器据此启用候选版本。
    ready: ({ id }) => {
      requireRelease(id)
      extension.ready(id)
      return snapshot()
    },
    // 页面卸载时通知管理器，结束该版本对应的挂载跟踪。
    unmount: ({ id }) => {
      requireRelease(id)
      extension.unmount(id)
      return snapshot()
    },
    // 只向已启用版本提供有效凭据，并附上对应的 Cloud API 地址。
    credential: ({ id }) => {
      requireActive(id)
      return { ...auth.credential(), cloudURL }
    },
    // generation 是会话代次：用于确认请求期间账号会话没有退出、失效或被替换。
    validate: ({ id, generation }) => {
      requireActive(id)
      return auth.validate(generation)
    },
    // 扩展收到服务端拒绝 token 时报告对应代次，避免旧请求把新会话错误地清除。
    reject: ({ id, generation }) => {
      requireActive(id)
      auth.reject(generation)
    },
  }
  // 应用真正退出时释放资源；切换页面不会触发这个事件。
  app.once('will-quit', () => {
    if (timer) clearInterval(timer)
    viewers.clear()
    auth.dispose()
    extension.dispose()
  })
  // 返回给 initializeCloud 的统一调用函数；它通过闭包继续使用上面的 handlers 和状态。
  return async (method, args, sender) => {
    // 移除期间拒绝其他操作，但允许页面离开并取消登记。
    if (removing && method !== 'leave') throw new CloudError('REMOVING')
    // 按操作名取处理函数，将参数和请求者传入；async 会把返回值包装成 Promise。
    return handlers[method](args, sender)
  }
}
