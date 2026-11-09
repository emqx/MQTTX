import { assert } from 'chai'
import { app, ipcMain } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { initializeCloud } from '../../../src/main/cloud'

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
        sender: { mainFrame: frame, once: () => {}, isDestroyed: () => false, send: () => {} },
      } as unknown as Electron.IpcMainInvokeEvent
      const environment = {
        MQTTX_CLOUD_AUTH_URL: 'https://auth.example.com',
        MQTTX_CLOUD_API_URL: 'https://cloud.example.com',
        MQTTX_CLOUD_DEV_URL: 'https://untrusted.example.com',
      }
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: false })
      initializeCloud({ ...environment, WEBPACK_DEV_SERVER_URL: 'http://localhost:8080' })
      assert.strictEqual((await handler(event, 'status', {})).error.code, 'INVALID_SERVICE_URL')
      initializeCloud(environment)
      assert.isTrue((await handler(event, 'status', {})).ok)
      Object.defineProperty(app, 'isPackaged', { configurable: true, value: true })
      initializeCloud({ ...environment, WEBPACK_DEV_SERVER_URL: 'http://localhost:8080' })
      assert.isTrue((await handler(event, 'status', {})).ok)
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
  it('keeps application startup running and reports invalid configuration through Cloud IPC', async () => {
    const originalHandle = ipcMain.handle
    const originalLog = console.error
    let handler: Parameters<typeof ipcMain.handle>[1] | undefined
    try {
      ipcMain.handle = (_channel, listener) => {
        handler = listener
      }
      console.error = () => {}
      for (const [auth, cloud] of [
        ['invalid-auth-url', 'https://cloud.example.com'],
        ['https://auth.example.com', 'invalid-cloud-url'],
      ]) {
        handler = undefined
        let startupContinued = false
        assert.doesNotThrow(() => {
          initializeCloud({ MQTTX_CLOUD_AUTH_URL: auth, MQTTX_CLOUD_API_URL: cloud })
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
      }
    } finally {
      ipcMain.handle = originalHandle
      console.error = originalLog
    }
  })
})
