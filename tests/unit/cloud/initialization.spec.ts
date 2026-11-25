import { assert } from 'chai'
import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { initializeCloud } from '../../../src/main/cloud'
import { CloudAuth } from '../../../src/main/cloud/auth'
import type { CloudSession } from '../../../src/types/cloud'

describe('Cloud initialization isolation', function () {
  // Expected failures format stack traces against the full webpack bundle's source map.
  this.timeout(10000)
  it('accepts the development main frame while rejecting other origins, subframes and packaged HTTP pages', async () => {
    const originalHandle = ipcMain.handle
    const originalLog = console.error
    const packaged = Object.getOwnPropertyDescriptor(app, 'isPackaged')
    let handler!: Parameters<typeof ipcMain.handle>[1]
    try {
      ipcMain.handle = (_channel, listener) => {
        handler = listener
      }
      console.error = () => {}
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: false })
      initializeCloud({
        MQTTX_CLOUD_AUTH_URL: 'invalid-auth-url',
        WEBPACK_DEV_SERVER_URL: 'http://localhost:8080/',
      })
      const frame = { url: 'http://localhost:8080/' }
      const event = { senderFrame: frame, sender: { mainFrame: frame } } as Electron.IpcMainInvokeEvent
      // Invalid configuration is returned only after the sender passes the source check.
      assert.strictEqual((await handler(event, 'enter', {})).error.code, 'INVALID_SERVICE_URL')
      for (const url of ['http://localhost:8081/', 'https://example.com/']) {
        const other = { url }
        const foreign = { senderFrame: other, sender: { mainFrame: other } } as Electron.IpcMainInvokeEvent
        assert.strictEqual((await handler(foreign, 'enter', {})).error.code, 'OPERATION_DENIED')
      }
      const child = { ...event, senderFrame: { ...frame } } as Electron.IpcMainInvokeEvent
      assert.strictEqual((await handler(child, 'enter', {})).error.code, 'OPERATION_DENIED')
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: true })
      assert.strictEqual((await handler(event, 'enter', {})).error.code, 'OPERATION_DENIED')
    } finally {
      ipcMain.handle = originalHandle
      console.error = originalLog
      if (packaged) Object.defineProperty(app, 'isPackaged', packaged)
      else Reflect.deleteProperty(app, 'isPackaged')
    }
  })
  it('accepts only loopback extension development URLs and ignores them outside host development mode', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-cloud-dev-'))
    const handle = ipcMain.handle,
      getPath = app.getPath,
      once = app.once,
      log = console.error
    const packaged = Object.getOwnPropertyDescriptor(app, 'isPackaged')
    const cleanup: Array<() => void> = []
    let handler!: Parameters<typeof ipcMain.handle>[1]
    try {
      app.getPath = () => root
      app.once = ((_event: string, listener: () => void) => {
        cleanup.push(listener)
        return app
      }) as typeof app.once
      ipcMain.handle = (_channel, listener) => {
        handler = listener
      }
      console.error = () => {}
      const frame = { url: 'app://./index.html' }
      const event = {
        senderFrame: frame,
        sender: { mainFrame: frame, on: () => {}, once: () => {}, isDestroyed: () => false, send: () => {} },
      } as unknown as Electron.IpcMainInvokeEvent
      const environment = {
        MQTTX_CLOUD_AUTH_URL: 'https://auth.example.com',
        MQTTX_CLOUD_DEV_URL: 'https://untrusted.example.com',
      }
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: false })
      initializeCloud({ ...environment, WEBPACK_DEV_SERVER_URL: 'http://localhost:8080' })
      assert.strictEqual((await handler(event, 'status', {})).error.code, 'INVALID_SERVICE_URL')
      initializeCloud(environment)
      assert.isTrue((await handler(event, 'status', {})).ok)
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: true })
      const runtimeEnvironment = {
        ...environment,
        MQTTX_CLOUD_AUTH_URL: 'invalid-auth-url',
        MQTTX_CLOUD_CATALOG_URL: 'http://127.0.0.1:43112/catalog.json',
        WEBPACK_DEV_SERVER_URL: 'http://localhost:8080',
      }
      initializeCloud(runtimeEnvironment, {})
      assert.strictEqual((await handler(event, 'status', {})).error.code, 'INVALID_SERVICE_URL')
      const catalogURL = 'https://extensions.example.com/catalog.json'
      initializeCloud(runtimeEnvironment, { catalogURL })
      assert.strictEqual((await handler(event, 'status', {})).error.code, 'SIGNATURE_INVALID')
      fs.mkdirSync(path.join(root, 'cloud'), { recursive: true })
      fs.writeFileSync(path.join(root, 'cloud', 'extension.json'), JSON.stringify({ removed: true }))
      initializeCloud(runtimeEnvironment)
      const status = await handler(event, 'status', {})
      assert.isTrue(status.ok)
      assert.isFalse(status.data.removed)
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: false })
      initializeCloud({
        ...environment,
        WEBPACK_DEV_SERVER_URL: 'http://localhost:8080',
        MQTTX_CLOUD_DEV_URL: 'http://127.0.0.1:5173',
      })
      const result = await handler(event, 'enter', {})
      assert.strictEqual(result.data.candidate.url, 'http://127.0.0.1:5173/dev.html')
    } finally {
      for (const dispose of cleanup) dispose()
      ipcMain.handle = handle
      app.getPath = getPath
      app.once = once
      console.error = log
      if (packaged) Object.defineProperty(app, 'isPackaged', packaged)
      else Reflect.deleteProperty(app, 'isPackaged')
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
  it('activates only the initiating window after successful login and restores it when minimized', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-cloud-focus-'))
    const handle = ipcMain.handle,
      getPath = app.getPath,
      once = app.once,
      login = CloudAuth.prototype.login,
      fromWebContents = BrowserWindow.fromWebContents
    const cleanup: Array<() => void> = []
    let handler!: Parameters<typeof ipcMain.handle>[1]
    try {
      app.getPath = () => root
      app.once = ((_event: string, listener: () => void) => {
        cleanup.push(listener)
        return app
      }) as typeof app.once
      ipcMain.handle = (_channel, listener) => {
        handler = listener
      }
      for (const outcome of [
        'success',
        'minimized',
        'failed',
        'cancelled',
        'closed-sender',
        'closed-window',
        'missing-window',
      ]) {
        const actions: string[] = []
        const frame = { url: 'app://./index.html' }
        const sender = { mainFrame: frame, isDestroyed: () => outcome === 'closed-sender' }
        const event = { sender, senderFrame: frame } as unknown as Electron.IpcMainInvokeEvent
        const window = {
          isDestroyed: () => outcome === 'closed-window',
          isMinimized: () => outcome === 'minimized',
          restore: () => actions.push('restore'),
          show: () => actions.push('show'),
          focus: () => actions.push('focus'),
        } as unknown as BrowserWindow
        BrowserWindow.fromWebContents = (contents) => {
          assert.strictEqual(contents, sender)
          return outcome === 'missing-window' ? null : window
        }
        let complete!: (session: CloudSession) => void
        CloudAuth.prototype.login = () =>
          new Promise((resolve) => {
            complete = resolve
          })
        initializeCloud({
          MQTTX_CLOUD_AUTH_URL: 'https://auth.example.com',
        })
        const request = handler(event, 'login', { locale: 'en' })
        assert.deepEqual(actions, [])
        complete({
          status: outcome === 'failed' || outcome === 'cancelled' ? 'signed-out' : 'signed-in',
          message: null,
          expiresAt: null,
          email: null,
        })
        assert.isTrue((await request).ok)
        assert.deepEqual(
          actions,
          outcome === 'success' ? ['show', 'focus'] : outcome === 'minimized' ? ['restore', 'show', 'focus'] : [],
        )
      }
    } finally {
      for (const dispose of cleanup) dispose()
      ipcMain.handle = handle
      app.getPath = getPath
      app.once = once
      CloudAuth.prototype.login = login
      BrowserWindow.fromWebContents = fromWebContents
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
  it('keeps application startup running and reports invalid configuration through Cloud IPC', async () => {
    const originalHandle = ipcMain.handle
    const originalLog = console.error
    let handler: Parameters<typeof ipcMain.handle>[1] | undefined
    try {
      ipcMain.handle = (_channel, listener) => {
        handler = listener
      }
      console.error = () => {}
      let startupContinued = false
      assert.doesNotThrow(() => {
        initializeCloud({ MQTTX_CLOUD_AUTH_URL: 'invalid-auth-url' })
        startupContinued = true
      })
      assert.isTrue(startupContinued)
      assert.isFunction(handler)
      const frame = { url: 'app://./index.html' }
      const event = { senderFrame: frame, sender: { mainFrame: frame } } as Electron.IpcMainInvokeEvent
      const response = await handler!(event, 'enter', {})
      assert.deepEqual(response, { ok: false, error: { code: 'INVALID_SERVICE_URL', params: {} } })
      const denied = await handler!({ ...event, senderFrame: null }, 'enter', {})
      assert.strictEqual(denied.error.code, 'OPERATION_DENIED')
    } finally {
      ipcMain.handle = originalHandle
      console.error = originalLog
    }
  })
})
