import { CloudError, cloudIssue } from '../../utils/cloudErrors'
import { app, ipcMain, safeStorage, shell } from 'electron'
import type { WebContents } from 'electron'
import path from 'path'
import fs from 'fs'
import { CloudBackend } from './backend'
import { CloudExtension, boundedFetch } from './extension'
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

export function initializeCloud(
  environment: NodeJS.ProcessEnv = {
    ...process.env,
    // Webpack injects the dev server URL only for a direct process.env reference.
    WEBPACK_DEV_SERVER_URL: process.env.WEBPACK_DEV_SERVER_URL,
  },
): void {
  let invoke: CloudInvoke | undefined
  let failure: CloudIssue | undefined
  try {
    invoke = createCloudRuntime(environment)
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

function createCloudRuntime(environment: NodeJS.ProcessEnv): CloudInvoke {
  const authURL = origin(environment.MQTTX_CLOUD_AUTH_URL || 'https://accounts.mqttce.com')
  const cloudURL = origin(environment.MQTTX_CLOUD_API_URL || 'https://cloud-intl.dev.en.consoleassets.mqttce.com')
  const developmentOrigin =
    !app.isPackaged && environment.WEBPACK_DEV_SERVER_URL && environment.MQTTX_CLOUD_DEV_URL
      ? origin(environment.MQTTX_CLOUD_DEV_URL)
      : undefined
  // Only allow a loopback development origin.
  if (
    developmentOrigin &&
    (!developmentOrigin.startsWith('http:') || new URL(developmentOrigin).hostname !== '127.0.0.1')
  )
    throw new CloudError('INVALID_SERVICE_URL')
  const root = path.join(app.getPath('userData'), 'cloud')
  const vault = new CredentialStore(root, safeStorage, JSON.stringify({ authURL, cloudURL, client: 'mqttx' }))
  const deviceIdentity = new CloudDeviceIdentity(path.join(root, 'device.json'))
  const auth = new CloudAuth({
    authURL,
    vault,
    getDeviceId: () => deviceIdentity.get(),
    openExternal: (url) => shell.openExternal(url),
  })
  const extension = new CloudExtension({
    developmentURL: developmentOrigin ? `${developmentOrigin}/dev.html` : undefined,
    root,
    catalogURL: environment.MQTTX_CLOUD_CATALOG_URL || 'http://127.0.0.1:43112/catalog.json',
    publicKey: environment.MQTTX_CLOUD_PUBLIC_KEY || '',
    checkInterval: environment.MQTTX_CLOUD_CATALOG_URL?.startsWith('http://127.0.0.1:')
      ? Math.max(2000, Number(environment.MQTTX_CLOUD_UPDATE_INTERVAL_MS) || 3600000)
      : 3600000,
  })
  const backends = new Map<string, { owner: WebContents; runtime?: CloudBackend }>()
  const stopBackend = (id: string): void => {
    backends.get(id)?.runtime?.dispose()
    backends.delete(id)
  }
  let removing = false,
    revision = 0,
    queued = false
  const viewers = new Set<WebContents>(),
    tracked = new WeakSet<WebContents>()
  let timer: ReturnType<typeof setInterval> | undefined
  const snapshot = (): CloudState => {
    const session: CloudSession = extension.removed
      ? { status: 'signed-out', message: null, expiresAt: null }
      : auth.state()
    return { ...extension.snapshot(), revision, session }
  }
  const changed = (): void => {
    revision++
    for (const id of backends.keys())
      if (auth.state().status !== 'signed-in' || !extension.resolve(id) || extension.removed) stopBackend(id)
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
  const watch = (sender: WebContents): void => {
    viewers.add(sender)
    if (!tracked.has(sender)) {
      tracked.add(sender)
      sender.once('destroyed', () => {
        viewers.delete(sender)
        for (const [id, backend] of backends) if (backend.owner === sender) stopBackend(id)
        schedule()
      })
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
    login: async ({ locale }) => {
      if (extension.removed) throw new CloudError('EXTENSION_STOPPED')
      await auth.login(locale)
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
    leave: (_args, sender) => {
      viewers.delete(sender)
      for (const [id, backend] of backends) if (backend.owner === sender) stopBackend(id)
      schedule()
    },
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
    ready: async ({ id }, sender) => {
      requireRelease(id)
      stopBackend(id)
      const startup: { owner: WebContents; runtime?: CloudBackend } = { owner: sender }
      backends.set(id, startup)
      try {
        let file = extension.backendFile(id)
        if (developmentOrigin) {
          const bytes = await boundedFetch(
            `${developmentOrigin}/backend.cjs`,
            8 * 1024 * 1024,
            AbortSignal.timeout(15000),
          )
          const directory = path.join(root, 'development', id)
          await fs.promises.mkdir(directory, { recursive: true })
          file = path.join(directory, 'backend.cjs')
          await fs.promises.writeFile(file, bytes)
        }
        requireRelease(id)
        if (
          backends.get(id) !== startup ||
          sender.isDestroyed() ||
          !viewers.has(sender) ||
          auth.state().status !== 'signed-in'
        )
          throw new CloudError('EXTENSION_STOPPED')
        const runtime = new CloudBackend(file, (method, params) => {
          requireActive(id)
          if (backends.get(id)?.runtime !== runtime) throw new CloudError('EXTENSION_STOPPED')
          if (method === 'credential') return { ...auth.credential(), cloudURL }
          if (method === 'validate' || method === 'reject') {
            const generation = (params as { generation?: unknown } | null)?.generation
            if (typeof generation !== 'number' || !Number.isSafeInteger(generation))
              throw new CloudError('OPERATION_DENIED')
            return method === 'validate' ? auth.validate(generation) : auth.reject(generation)
          }
          throw new CloudError('OPERATION_DENIED')
        })
        startup.runtime = runtime
        await runtime.ready
        requireRelease(id)
        if (backends.get(id)?.runtime !== runtime) throw new CloudError('EXTENSION_STOPPED')
        extension.ready(id)
      } catch (error) {
        if (backends.get(id) === startup) {
          stopBackend(id)
          extension.failed(id, cloudIssue(error))
        }
        throw error
      }
      return snapshot()
    },
    unmount: ({ id }) => {
      requireRelease(id)
      stopBackend(id)
      extension.unmount(id)
      return snapshot()
    },
    // MQTTX only routes business calls; API paths and response handling belong to the extension.
    backend: async ({ id, method, params }, sender) => {
      requireActive(id)
      const backend = backends.get(id)
      if (!backend?.runtime || backend.owner !== sender) throw new CloudError('EXTENSION_STOPPED')
      const generation = auth.credential().generation
      const result = await backend.runtime.call(method, params)
      requireActive(id)
      if (!auth.validate(generation) || backends.get(id) !== backend) throw new CloudError('SESSION_CHANGED')
      return result
    },
  }
  app.once('will-quit', () => {
    if (timer) clearInterval(timer)
    viewers.clear()
    for (const id of backends.keys()) stopBackend(id)
    auth.dispose()
    extension.dispose()
  })
  return async (method, args, sender) => {
    if (removing && method !== 'leave') throw new CloudError('REMOVING')
    return handlers[method](args, sender)
  }
}
