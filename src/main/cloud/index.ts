import { CloudError, cloudIssue } from '../../utils/cloudErrors'
import { app, ipcMain, safeStorage, shell } from 'electron'
import type { WebContents } from 'electron'
import path from 'path'
import { CloudExtension } from './extension'
import { CredentialStore } from './storage'
import { CloudAuth, origin } from './auth'
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
    // webpack injects this value only when it is referenced directly.
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
  const authURL = origin(environment.MQTTX_CLOUD_AUTH_URL || 'http://127.0.0.1:43110')
  const cloudURL = origin(environment.MQTTX_CLOUD_API_URL || 'http://127.0.0.1:43111')
  const developmentOrigin =
    !app.isPackaged && environment.WEBPACK_DEV_SERVER_URL && environment.MQTTX_CLOUD_DEV_URL
      ? origin(environment.MQTTX_CLOUD_DEV_URL)
      : undefined
  if (
    developmentOrigin &&
    (!developmentOrigin.startsWith('http:') || new URL(developmentOrigin).hostname !== '127.0.0.1')
  )
    throw new CloudError('INVALID_SERVICE_URL')
  const root = path.join(app.getPath('userData'), 'cloud')
  const vault = new CredentialStore(root, safeStorage, JSON.stringify({ authURL, cloudURL, client: 'mqttx' }))
  const auth = new CloudAuth({ authURL, vault, openExternal: (url) => shell.openExternal(url) })
  const extension = new CloudExtension({
    developmentURL: developmentOrigin ? `${developmentOrigin}/dev.html` : undefined,
    cloudURL,
    root,
    catalogURL: environment.MQTTX_CLOUD_CATALOG_URL || 'http://127.0.0.1:43112/catalog.json',
    publicKey: environment.MQTTX_CLOUD_PUBLIC_KEY || '',
    checkInterval: environment.MQTTX_CLOUD_CATALOG_URL?.startsWith('http://127.0.0.1:')
      ? Math.max(2000, Number(environment.MQTTX_CLOUD_UPDATE_INTERVAL_MS) || 3600000)
      : 3600000,
  })
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
    ready: ({ id }) => {
      requireRelease(id)
      extension.ready(id)
      return snapshot()
    },
    unmount: ({ id }) => {
      requireRelease(id)
      extension.unmount(id)
      return snapshot()
    },
    credential: ({ id }) => {
      requireActive(id)
      return { ...auth.credential(), cloudURL }
    },
    validate: ({ id, generation }) => {
      requireActive(id)
      return auth.validate(generation)
    },
    reject: ({ id, generation }) => {
      requireActive(id)
      auth.reject(generation)
    },
  }
  app.once('will-quit', () => {
    if (timer) clearInterval(timer)
    viewers.clear()
    auth.dispose()
    extension.dispose()
  })
  return async (method, args, sender) => {
    if (removing && method !== 'leave') throw new CloudError('REMOVING')
    return handlers[method](args, sender)
  }
}
