import { once } from 'events'
import type { CredentialProtection } from '../../../src/main/cloud/storage'
import type { AddressInfo } from 'net'
import { buildCloudTestWorkers } from './workerFixture'
import { assert } from 'chai'
import { expectError, expectRejection } from './assertions'
import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import { randomBytes, createCipheriv, createDecipheriv, createHash, generateKeyPairSync, sign } from 'crypto'
import { zipSync } from 'fflate'
import { extractCloudZip } from '../../../src/main/cloud/package'
import { CredentialStore } from '../../../src/main/cloud/storage'
import { CloudExtension } from '../../../src/main/cloud/extension'
import { inspect } from '../../../src/main/cloud/manifest'
import { CloudAuth } from '../../../src/main/cloud/auth'
let workers: ReturnType<typeof buildCloudTestWorkers>
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-cloud-unit-'))
function secure(): CredentialProtection {
  const key = randomBytes(32)
  return {
    isEncryptionAvailable: () => true,
    getSelectedStorageBackend: () => 'gnome_libsecret',
    encryptString: (s) => {
      const iv = randomBytes(12),
        c = createCipheriv('aes-256-gcm', key, iv)
      const data = Buffer.concat([c.update(s), c.final()])
      return Buffer.concat([iv, c.getAuthTag(), data])
    },
    decryptString: (b) => {
      const d = createDecipheriv('aes-256-gcm', key, b.subarray(0, 12))
      d.setAuthTag(b.subarray(12, 28))
      return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString()
    },
  }
}
const listen = (s: http.Server): Promise<string> =>
  new Promise<string>((resolve) =>
    s.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)),
  )
const close = async (s: http.Server): Promise<void> => {
  s.closeAllConnections()
  await new Promise<void>((resolve, reject) => s.close((error) => (error ? reject(error) : resolve())))
}
function archive(version = '1.0.0', override = {}) {
  return Buffer.from(
    zipSync({
      'backend.cjs': Buffer.from("require('node:worker_threads').parentPort.postMessage({ type: 'ready' })"),
      'plugin.json': Buffer.from(
        JSON.stringify({
          id: 'emqx.cloud',
          version,
          kind: 'page',
          apiVersion: 1,
          entry: 'index.html',
          backend: 'backend.cjs',
          ...override,
        }),
      ),
      'index.html': Buffer.from('<!doctype html><script src="app.js"></script>'),
      'app.js': Buffer.from('console.log("ready")'),
    }),
  )
}
async function settled(extension: CloudExtension): Promise<void> {
  while (extension.snapshot().busy) await once(extension, 'change')
}
async function delivery(options = {}) {
  let version = '1.0.0',
    bytes = archive(version),
    badHash = false,
    badAPI = false,
    requests = 0
  let base = ''
  const server = http.createServer((req, res) => {
    requests++
    if (req.url === '/catalog.json')
      res.end(
        JSON.stringify({
          schema: 1,
          releases: [
            {
              id: 'emqx.cloud',
              version,
              apiVersion: badAPI ? 9 : 1,
              url: base + '/package.zip',
              sha256: badHash ? '0'.repeat(64) : createHash('sha256').update(bytes).digest('hex'),
            },
          ],
        }),
      )
    else res.end(bytes)
  })
  base = await listen(server)
  const e = new CloudExtension({
    root: temp(),
    installWorkerPath: workers.installer,
    catalogURL: base + '/catalog.json',
    checkInterval: 0,
    readyTimeout: 30,
    ...options,
  })
  return {
    e,
    base,
    server,
    count: () => requests,
    update: (v: string) => {
      version = v
      bytes = archive(v)
    },
    hashFail: () => {
      badHash = true
    },
    apiFail: () => {
      badAPI = true
    },
    stop: async () => {
      e.dispose()
      await close(server)
    },
  }
}
describe('Cloud cloud', () => {
  before(() => {
    workers = buildCloudTestWorkers()
  })
  after(() => workers.dispose())
  it('encrypted session survives restart, binds to endpoint and logout invalidates saved copies', () => {
    const root = temp(),
      crypto = secure(),
      v = new CredentialStore(root, crypto, 'origin-A')
    const token = { value: 'never-store-plaintext', expiresAt: Date.now() + 50000 }
    v.save(token)
    assert.strictEqual(fs.readFileSync(v.file, 'utf8').includes(token.value), false)
    assert.deepEqual(new CredentialStore(root, crypto, 'origin-A').load(), token)
    assert.strictEqual(new CredentialStore(root, crypto, 'origin-B').load(), null)
    const old = fs.readFileSync(v.file)
    v.clear()
    fs.writeFileSync(v.file, old)
    assert.strictEqual(v.load(), null)
    crypto.isEncryptionAvailable = () => false
    expectError(() => v.save(token), { code: 'STORAGE_UNAVAILABLE' })
    fs.rmSync(root, { recursive: true })
  })
  it('loads a development page without downloading or changing installed extension state', async () => {
    const root = temp()
    const saved = JSON.stringify({ removed: true, active: null })
    fs.writeFileSync(path.join(root, 'extension.json'), saved)
    fs.mkdirSync(path.join(root, 'releases'))
    fs.writeFileSync(path.join(root, 'releases', 'existing'), 'keep')
    const extension = new CloudExtension({
      root,
      catalogURL: 'invalid-catalog-must-not-be-read',
      developmentURL: 'http://127.0.0.1:5173/dev.html',
    })
    try {
      await extension.enter()
      const candidate = extension.snapshot().candidate!
      assert.strictEqual(candidate.url, 'http://127.0.0.1:5173/dev.html')
      assert.strictEqual(candidate.version, 'development')
      extension.mounting(candidate.id)
      extension.ready(candidate.id)
      assert.isTrue(extension.isActive(candidate.id))
      extension.check()
      assert.isFalse(extension.snapshot().busy)
      await extension.remove()
      assert.isTrue(extension.removed)
      assert.strictEqual(fs.readFileSync(path.join(root, 'extension.json'), 'utf8'), saved)
      assert.strictEqual(fs.readFileSync(path.join(root, 'releases', 'existing'), 'utf8'), 'keep')
      await extension.enter(true)
      const next = extension.snapshot().candidate!
      extension.failed(next.id, { code: 'PAGE_START_TIMEOUT', params: {} })
      await extension.retry()
      assert.isOk(extension.snapshot().candidate)
    } finally {
      extension.dispose()
      fs.rmSync(root, { recursive: true, force: true })
    }
  })
  it('startup stays offline; first enter downloads; page-ready commits; restart reuses installed version', async () => {
    const d = await delivery()
    try {
      assert.strictEqual(d.count(), 0)
      await d.e.enter()
      await settled(d.e)
      assert.isOk(d.e.snapshot().candidate)
      assert.strictEqual(d.e.snapshot().active, null)
      const id = d.e.snapshot().candidate!.id
      d.e.mounting(id)
      d.e.ready(id)
      await settled(d.e)
      assert.strictEqual(d.e.snapshot().active!.version, '1.0.0')
      const other = new CloudExtension({
        installWorkerPath: workers.installer,
        root: d.e.root,
        catalogURL: d.base + '/catalog.json',
      })
      const before = d.count()
      await other.enter()
      assert.strictEqual(d.count(), before)
      assert.strictEqual(other.snapshot().candidate!.id, id)
      other.ready(id)
      other.dispose()
      const response = await fetch(d.e.snapshot().active!.url, { headers: { 'Sec-Fetch-Dest': 'iframe' } })
      assert.match(response.headers.get('content-security-policy') || '', /connect-src 'none';/)
      assert.match(response.headers.get('content-security-policy') || '', /sandbox allow-scripts/)
    } finally {
      await d.stop()
    }
  })
  it('bad hash and incompatible release leave old working version; failed trial rolls back without restart', async () => {
    const d = await delivery()
    try {
      await d.e.enter()
      await settled(d.e)
      d.e.ready(d.e.snapshot().candidate!.id)
      await settled(d.e)
      d.update('1.0.1')
      d.e.check()
      await settled(d.e)
      assert.strictEqual(d.e.snapshot().active!.version, '1.0.0')
      d.e.mounting(d.e.snapshot().candidate!.id)
      await new Promise<void>((r) => setTimeout(r, 45))
      assert.strictEqual(d.e.snapshot().candidate, null)
      assert.strictEqual(d.e.snapshot().active!.version, '1.0.0')
      assert.strictEqual(d.e.snapshot().updateError!.code, 'PAGE_START_TIMEOUT')
      d.update('1.0.2')
      d.hashFail()
      d.e.check()
      await settled(d.e)
      assert.strictEqual(d.e.snapshot().active!.version, '1.0.0')
      assert.strictEqual(d.e.snapshot().updateError!.code, 'CHECKSUM_MISMATCH')
      d.apiFail()
      d.e.check()
      await settled(d.e)
      assert.strictEqual(d.e.snapshot().active!.version, '1.0.0')
      assert.strictEqual(d.e.snapshot().updateError!.code, 'NO_COMPATIBLE_VERSION')
    } finally {
      await d.stop()
    }
  })
  it('removal cancels preparation, deletes owned assets and persists across restart until explicit add', async () => {
    const d = await delivery()
    try {
      await d.e.enter()
      await d.e.remove()
      assert.strictEqual(d.e.snapshot().candidate, null)
      assert.strictEqual(d.e.snapshot().removed, true)
      const other = new CloudExtension({
        installWorkerPath: workers.installer,
        root: d.e.root,
        catalogURL: d.base + '/catalog.json',
      })
      const count = d.count()
      await other.enter()
      assert.strictEqual(count, d.count())
      await other.enter(true)
      await settled(other)
      assert.isOk(other.snapshot().candidate)
      other.dispose()
    } finally {
      await d.stop()
    }
  })
  it('encapsulates release state and retries a previously rejected version through its API', async () => {
    const d = await delivery()
    try {
      await d.e.enter()
      await settled(d.e)
      const id = d.e.snapshot().candidate!.id
      const release = d.e.resolve(id)!
      release.version = '99.0.0'
      assert.strictEqual(d.e.snapshot().candidate!.version, '1.0.0')
      d.e.failed(id, { code: 'PAGE_START_FAILED', params: {} })
      d.e.check()
      await settled(d.e)
      assert.isNull(d.e.snapshot().candidate)
      await d.e.retry()
      await settled(d.e)
      assert.strictEqual(d.e.snapshot().candidate!.version, '1.0.0')
      await d.e.remove()
      const count = d.count()
      await d.e.retry()
      assert.strictEqual(d.count(), count)
      assert.isTrue(d.e.removed)
    } finally {
      await d.stop()
    }
  })
  it('signed catalog verifies release metadata; package traversal and unsupported entries rejected', async () => {
    const { publicKey } = generateKeyPairSync('ed25519')
    const d = await delivery({ publicKey })
    try {
      await d.e.enter()
      await settled(d.e)
      assert.strictEqual(d.e.snapshot().error!.code, 'SIGNATURE_INVALID')
      const bad = archive('2.0.0', { apiVersion: 9 })
      const folder = temp()
      extractCloudZip(bad, folder)
      expectError(() => inspect(folder), { code: 'PACKAGE_INVALID' })
      const zip = Buffer.from(zipSync({ '../outside': Buffer.from('x') }))
      assert.throws(() => extractCloudZip(zip, folder), /Unsafe/)
    } finally {
      await d.stop()
    }
  })
  it('auth supplies credentials only through its internal API and rejects stale invalidation', () => {
    const token = { value: 'secret-token', expiresAt: Date.now() + 60000 }
    let saved: typeof token | null = token
    let changes = 0
    const auth = new CloudAuth({
      getDeviceId: async () => '550e8400-e29b-41d4-a716-446655440000',
      authURL: 'http://127.0.0.1:43110',
      openExternal: async () => {},
      vault: {
        load: () => saved,
        save: (v: typeof token) => {
          saved = v
        },
        clear: () => {
          saved = null
        },
      },
    })
    assert.strictEqual(JSON.stringify(auth.state()).includes(token.value), false)
    auth.subscribeState(() => changes++)
    const credential = auth.credential()
    assert.strictEqual(credential.value, token.value)
    auth.reject(credential.generation - 1)
    assert.strictEqual(auth.validate(credential.generation), true)
    auth.reject(credential.generation)
    assert.strictEqual(saved, null)
    assert.strictEqual(changes, 1)
    assert.strictEqual(auth.validate(credential.generation), false)
    expectError(() => auth.credential(), { code: 'LOGIN_REQUIRED' })
    auth.dispose()
  })
  it('publishes session expiry without relying on extension polling', async () => {
    let token: { value: string; expiresAt: number } | null = { value: 'short-lived', expiresAt: Date.now() + 30 }
    const auth = new CloudAuth({
      getDeviceId: async () => '550e8400-e29b-41d4-a716-446655440000',
      authURL: 'https://auth.example.com',
      openExternal: async () => {},
      vault: {
        load: () => token,
        save: (value) => {
          token = value
        },
        clear: () => {
          token = null
        },
      },
    })
    try {
      auth.state()
      await new Promise<void>((resolve) =>
        auth.subscribeState(() => {
          if (auth.state().status === 'expired') resolve()
        }),
      )
      assert.isNull(token)
      assert.strictEqual(auth.state().message!.code, 'AUTH_EXPIRED')
    } finally {
      auth.dispose()
    }
  })
})
