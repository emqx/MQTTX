import { CloudError, cloudIssue } from '../../utils/cloudErrors'
import { cloudConnectionURL } from '../../utils/cloudConnection'
import { app, BrowserWindow, clipboard, ipcMain, safeStorage, shell } from 'electron'
import type { WebContents } from 'electron'
import { createHash } from 'crypto'
import path from 'path'
import { cloudGet } from './api'
import { CloudExtension } from './extension'
import { CredentialStore } from './storage'
import { CloudAuth, origin } from './auth'
import { CloudDeviceIdentity } from './device'
import { parseCloudRequest } from './requests'
import { logCloudFailure } from './diagnostics'
import type { CloudMethod, CloudParams, CloudResults, CloudState, CloudIssue, CloudSession } from '../../types/cloud'

type Handlers = {
  [M in CloudMethod]: (args: CloudParams[M], sender: WebContents) => CloudResults[M] | Promise<CloudResults[M]>
}
type CloudInvoke = <M extends CloudMethod>(
  method: M,
  args: CloudParams[M],
  sender: WebContents,
) => Promise<CloudResults[M]>
type PackagedDistribution = { catalogURL?: string; publicKey?: string }

export function initializeCloud(
  environment: NodeJS.ProcessEnv = {
    ...process.env,
    // Webpack injects the dev server URL only for a direct process.env reference.
    WEBPACK_DEV_SERVER_URL: process.env.WEBPACK_DEV_SERVER_URL,
  },
  packagedDistribution: PackagedDistribution = {
    catalogURL: 'https://mqttx-cloud-extension.emqx.com/catalog.json',
    publicKey:
      '-----BEGIN PUBLIC KEY-----\n' +
      'MCowBQYDK2VwAyEAg39Myy7RhzFu9YaFlnv3pEgmpinPme+zXru82t4zVDU=\n' +
      '-----END PUBLIC KEY-----\n',
  },
): void {
  let invoke: CloudInvoke | undefined
  let failure: CloudIssue | undefined
  try {
    invoke = createCloudRuntime(environment, packagedDistribution)
  } catch (error) {
    logCloudFailure('initialization', error)
    failure = cloudIssue(error)
  }
  ipcMain.handle('cloud:invoke', async (event, method: unknown, args: unknown = {}) => {
    try {
      const frame = event.senderFrame
      const url = new URL(frame?.url || 'about:blank')
      const development =
        !app.isPackaged &&
        environment.WEBPACK_DEV_SERVER_URL &&
        url.origin === new URL(environment.WEBPACK_DEV_SERVER_URL).origin
      const local = url.protocol === 'app:' && url.hostname === '.' && url.pathname === '/index.html'
      if (frame !== event.sender.mainFrame || !(development || local)) throw new CloudError('OPERATION_DENIED')
      const request = parseCloudRequest(method, args)
      if (!invoke) return { ok: false, error: failure }
      return { ok: true, data: await invoke(request.method, request.args, event.sender) }
    } catch (error) {
      logCloudFailure('host request', error)
      return { ok: false, error: cloudIssue(error) }
    }
  })
}

function createCloudRuntime(environment: NodeJS.ProcessEnv, packagedDistribution: PackagedDistribution): CloudInvoke {
  const packaged = app.isPackaged
  const services = packaged
    ? {
        authURL: 'https://accounts.emqx.com',
        apiURL: 'https://cloud-intl.emqx.com',
        ...packagedDistribution,
      }
    : {
        authURL: environment.MQTTX_CLOUD_AUTH_URL || 'https://accounts.mqttce.com',
        apiURL: 'https://cloud-intl.dev.en.consoleassets.mqttce.com',
        catalogURL: environment.MQTTX_CLOUD_CATALOG_URL || 'http://127.0.0.1:43112/catalog.json',
        publicKey: environment.MQTTX_CLOUD_PUBLIC_KEY,
      }
  const { apiURL, catalogURL, publicKey } = services
  const authURL = origin(services.authURL)
  if (!catalogURL) throw new CloudError('INVALID_SERVICE_URL')
  const developmentOrigin =
    !packaged && environment.WEBPACK_DEV_SERVER_URL && environment.MQTTX_CLOUD_DEV_URL
      ? origin(environment.MQTTX_CLOUD_DEV_URL)
      : undefined
  // Only allow a loopback development origin.
  if (
    developmentOrigin &&
    (!developmentOrigin.startsWith('http:') || new URL(developmentOrigin).hostname !== '127.0.0.1')
  )
    throw new CloudError('INVALID_SERVICE_URL')
  const root = path.join(app.getPath('userData'), 'cloud')
  const vault = new CredentialStore(root, safeStorage, JSON.stringify({ authURL, apiURL, client: 'mqttx' }))
  const deviceIdentity = new CloudDeviceIdentity()
  const auth = new CloudAuth({
    authURL,
    vault,
    getDeviceId: () => deviceIdentity.get(),
    openExternal: (url) => shell.openExternal(url),
  })
  const extension = new CloudExtension({
    developmentURL: developmentOrigin ? `${developmentOrigin}/dev.html` : undefined,
    // Cached extensions are loaded before an update check, so keep their trust roots separate.
    root: packaged
      ? path.join(
          root,
          'catalogs',
          createHash('sha256')
            .update(JSON.stringify([catalogURL, publicKey]))
            .digest('hex'),
        )
      : root,
    catalogURL,
    publicKey,
    allowUnsignedLocal: !packaged,
    checkInterval:
      !packaged && environment.MQTTX_CLOUD_CATALOG_URL?.startsWith('http://127.0.0.1:')
        ? Math.max(2000, Number(environment.MQTTX_CLOUD_UPDATE_INTERVAL_MS) || 3600000)
        : 3600000,
  })
  const pages = new Map<string, { owner: WebContents; lifetime: AbortController; pending: number }>()
  const releasePage = (id: string): void => {
    pages.get(id)?.lifetime.abort()
    pages.delete(id)
  }
  let removing = false,
    revision = 0,
    queued = false
  const viewers = new Set<WebContents>(),
    tracked = new WeakSet<WebContents>()
  let timer: ReturnType<typeof setInterval> | undefined
  const snapshot = (): CloudState => {
    const session: CloudSession = extension.removed
      ? { status: 'signed-out', message: null, expiresAt: null, email: null }
      : auth.state()
    return { ...extension.snapshot(), revision, session }
  }
  const changed = (): void => {
    revision++
    for (const id of pages.keys())
      if (auth.state().status !== 'signed-in' || !extension.resolve(id) || extension.removed) releasePage(id)
    if (queued) return
    queued = true
    queueMicrotask(() => {
      const state = snapshot()
      queued = false
      for (const viewer of viewers) if (!viewer.isDestroyed()) viewer.send('cloud:state', state)
    })
  }
  const schedule = (): void => {
    if (viewers.size && !timer && !developmentOrigin)
      timer = setInterval(() => extension.check(), extension.checkInterval)
    if (!viewers.size && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
  const releaseViewer = (sender: WebContents): void => {
    viewers.delete(sender)
    for (const [id, page] of pages) if (page.owner === sender) releasePage(id)
    schedule()
  }
  const watch = (sender: WebContents): void => {
    viewers.add(sender)
    if (!tracked.has(sender)) {
      tracked.add(sender)
      sender.once('destroyed', () => releaseViewer(sender))
    }
    schedule()
  }
  extension.on('change', changed)
  auth.subscribeState(changed)
  const requireRelease = (id: string): void => {
    if (!extension.resolve(id) || extension.removed) throw new CloudError('EXTENSION_STOPPED')
  }
  const requireActive = (id: string): void => {
    requireRelease(id)
    if (!extension.isActive(id)) throw new CloudError('NOT_READY')
  }
  const prepare = async (sender: WebContents, explicit = false): Promise<CloudState> => {
    watch(sender)
    if (explicit && extension.removed) auth.invalidate()
    await extension.enter(explicit)
    return snapshot()
  }
  const handlers: Handlers = {
    login: async ({ locale }, sender) => {
      if (extension.removed) throw new CloudError('EXTENSION_STOPPED')
      const session = await auth.login(locale)
      if (session.status === 'signed-in' && !sender.isDestroyed()) {
        const window = BrowserWindow.fromWebContents(sender)
        if (window && !window.isDestroyed()) {
          if (window.isMinimized()) window.restore()
          window.show()
          window.focus()
        }
      }
      return snapshot()
    },
    logout: () => {
      auth.invalidate()
      return snapshot()
    },
    cancel: () => {
      auth.invalidate()
      return snapshot()
    },
    status: () => snapshot(),
    enter: (_args, sender) => prepare(sender),
    add: (_args, sender) => prepare(sender, true),
    retry: async (_args, sender) => {
      watch(sender)
      await extension.retry()
      return snapshot()
    },
    leave: (_args, sender) => releaseViewer(sender),
    remove: async () => {
      removing = true
      try {
        let error: unknown
        try {
          auth.invalidate()
        } catch (cause) {
          error = cause
        }
        await extension.remove()
        if (error) throw error
        return snapshot()
      } finally {
        removing = false
      }
    },
    mounting: ({ id }) => {
      requireRelease(id)
      extension.mounting(id)
      return snapshot()
    },
    ready: ({ id }, sender) => {
      requireRelease(id)
      if (!viewers.has(sender) || auth.state().status !== 'signed-in') throw new CloudError('EXTENSION_STOPPED')
      releasePage(id)
      try {
        extension.ready(id)
      } catch (error) {
        extension.failed(id, cloudIssue(error))
        throw error
      }
      pages.set(id, { owner: sender, lifetime: new AbortController(), pending: 0 })
      return snapshot()
    },
    unmount: ({ id }) => {
      requireRelease(id)
      releasePage(id)
      extension.unmount(id)
      return snapshot()
    },
    createConnection: ({ id, connection }, sender) => {
      requireActive(id)
      if (pages.get(id)?.owner !== sender) throw new CloudError('OPERATION_DENIED')
      auth.credential()
      return connection
    },
    copyText: ({ id, text }, sender) => {
      requireActive(id)
      if (pages.get(id)?.owner !== sender) throw new CloudError('OPERATION_DENIED')
      auth.credential()
      clipboard.writeText(text)
    },
    copyConnection: ({ id, connection }, sender) => {
      requireActive(id)
      if (pages.get(id)?.owner !== sender) throw new CloudError('OPERATION_DENIED')
      auth.credential()
      clipboard.writeText(cloudConnectionURL(connection))
    },
    request: async ({ id, path }, sender) => {
      requireActive(id)
      const page = pages.get(id)
      if (!page || page.owner !== sender) throw new CloudError('OPERATION_DENIED')
      if (page.pending >= 32) throw new CloudError('REQUEST_LIMIT')
      page.pending++
      try {
        return await cloudGet(apiURL, path, auth, page.lifetime.signal)
      } finally {
        page.pending--
      }
    },
  }
  app.once('will-quit', () => {
    if (timer) clearInterval(timer)
    viewers.clear()
    for (const id of pages.keys()) releasePage(id)
    auth.dispose()
    extension.dispose()
  })
  return async (method, args, sender) => {
    if (removing && method !== 'leave') throw new CloudError('REMOVING')
    return handlers[method](args, sender)
  }
}
