import { assert } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { CloudBackend } from '../../../src/main/cloud/backend'
import { expectRejection } from './assertions'

describe('Cloud extension backend', () => {
  let directory: string
  let runtime: CloudBackend | undefined
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-cloud-backend-'))
  })
  afterEach(() => {
    runtime?.dispose()
    fs.rmSync(directory, { recursive: true, force: true })
  })
  function start(script: string, host: (method: string, params: unknown) => unknown): CloudBackend {
    const file = path.join(directory, 'backend.cjs')
    fs.writeFileSync(file, script)
    runtime = new CloudBackend(file, host)
    return runtime
  }
  it('routes authentication to the host and returns business results without exposing credentials', async () => {
    const backend = start(
      `const { parentPort: port } = require('node:worker_threads')
      let request
      port.on('message', message => {
        if (message.type === 'call') {
          request = message
          port.postMessage({ type: 'host', seq: 1, method: 'credential' })
        } else if (message.type === 'host-result') {
          port.postMessage({ type: 'result', seq: request.seq, ok: true, data: { authorized: message.data.value === 'secret', page: request.params.page } })
        }
      })
      port.postMessage({ type: 'ready' })`,
      (method) => {
        assert.strictEqual(method, 'credential')
        return { value: 'secret' }
      },
    )
    assert.deepEqual(await backend.call('deployments', { page: 2 }), { authorized: true, page: 2 })
  })
  it('rejects unfinished requests when the page is unloaded', async () => {
    const backend = start(`require('node:worker_threads').parentPort.postMessage({ type: 'ready' })`, () => undefined)
    await backend.ready
    const request = backend.call('deployments', {})
    const rejected = expectRejection(request, { code: 'EXTENSION_STOPPED' })
    backend.dispose()
    await rejected
    await expectRejection(backend.call('deployments', {}), { code: 'EXTENSION_STOPPED' })
  })
  it('reports a backend that exits before becoming ready', async () => {
    const backend = start('process.exit(0)', () => undefined)
    await expectRejection(backend.ready, { code: 'EXTENSION_STOPPED' })
  })
})
