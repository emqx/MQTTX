import { assert } from 'chai'
import { expectError, expectRejection } from './assertions'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { zipSync } from 'fflate'
import { installCloudPackage } from '../../../src/main/cloud/installer'
import { buildCloudTestWorkers } from './workerFixture'
import { createHash } from 'crypto'
import { extractCloudZip } from '../../../src/main/cloud/package'

function zip(entries: Record<string, string> = {}) {
  return Buffer.from(
    zipSync(Object.fromEntries(Object.entries(entries).map(([name, value]) => [name, Buffer.from(value)]))),
  )
}
function target(run: (root: string) => void) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-cloud-package-'))
  try {
    run(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}
const central = (data: Buffer) => data.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))

describe('Cloud package', () => {
  let workers: ReturnType<typeof buildCloudTestWorkers>
  before(() => {
    workers = buildCloudTestWorkers()
  })
  after(() => workers.dispose())
  it('checks and extracts a large package without blocking the main event loop', async function () {
    this.timeout(10000)
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-install-worker-'))
    const files: Record<string, string> = {
      'backend.cjs': "require('node:worker_threads').parentPort.postMessage({ type: 'ready' })",
      'plugin.json': JSON.stringify({
        id: 'emqx.cloud',
        version: '1.0.0',
        kind: 'page',
        apiVersion: 1,
        entry: 'index.html',
        backend: 'backend.cjs',
      }),
      'index.html': '<main></main>',
    }
    for (let i = 0; i < 400; i++) files[`assets/${i}.txt`] = 'x'.repeat(64 * 1024)
    const bytes = zip(files)
    let ticks = 0
    const timer = setInterval(() => {
      ticks++
    }, 5)
    try {
      const manifest = await installCloudPackage(
        { bytes, directory, hash: createHash('sha256').update(bytes).digest('hex'), version: '1.0.0' },
        new AbortController().signal,
        workers.installer,
      )
      assert.strictEqual(manifest.version, '1.0.0')
      assert.strictEqual(fs.readdirSync(path.join(directory, 'assets')).length, 400)
      assert.isAbove(ticks, 0)
      await expectRejection(
        installCloudPackage(
          { bytes, directory, hash: '0'.repeat(64), version: '1.0.0' },
          new AbortController().signal,
          workers.installer,
        ),
        { code: 'CHECKSUM_MISMATCH' },
      )
    } finally {
      clearInterval(timer)
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })
  it('terminates an installation worker before a cancelled task can keep writing', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-cancel-install-'))
    const abort = new AbortController()
    const bytes = zip({ 'index.html': 'cancel' })
    const task = installCloudPackage(
      { bytes, directory, hash: createHash('sha256').update(bytes).digest('hex'), version: '1.0.0' },
      abort.signal,
      workers.installer,
    )
    const rejected = expectRejection(task, { code: 'EXTENSION_STOPPED' })
    abort.abort()
    try {
      await rejected
      assert.deepEqual(fs.readdirSync(directory), [])
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })

  it('extracts Cloud browser assets as data without executing scripts', () =>
    target((root) => {
      const script = 'throw new Error("must never execute while extracting")'
      const data = zip({
        'backend.cjs': "require('node:worker_threads').parentPort.postMessage({ type: 'ready' })",
        'plugin.json': '{"kind":"page"}',
        'index.html': '<script src="assets/app.js"></script>',
        'assets/app.js': script,
      })
      extractCloudZip(data, root)
      assert.strictEqual(fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8'), script)
    }))

  it('rejects traversal, absolute paths, Windows paths and reserved names before writing files', () =>
    target((root) => {
      for (const name of [
        '../outside.js',
        '/tmp/outside.js',
        'a/../../outside.js',
        'a\\..\\outside.js',
        'C:/outside.js',
        'file:stream',
        'NUL.txt',
      ]) {
        assert.throws(() => extractCloudZip(zip({ 'index.html': 'valid', [name]: 'unsafe' }), root), /Unsafe/)
        assert.deepEqual(fs.readdirSync(root), [])
      }
    }))

  it('rejects case aliases and conflicting parent paths', () =>
    target((root) => {
      for (const entries of [
        { 'App.js': 'a', 'app.js': 'b' },
        { assets: 'a', 'assets/app.js': 'b' },
      ] as Record<string, string>[]) {
        assert.throws(() => extractCloudZip(zip(entries), root), /Duplicate|Conflicting/)
        assert.deepEqual(fs.readdirSync(root), [])
      }
    }))

  it('rejects linked and encrypted ZIP entries', () =>
    target((root) => {
      for (const kind of ['symlink', 'encrypted']) {
        const data = zip({ 'index.html': 'test' }),
          offset = central(data)
        if (kind === 'symlink') data.writeUInt32LE((0xa1ff << 16) >>> 0, offset + 38)
        else data.writeUInt16LE(data.readUInt16LE(offset + 8) | 1, offset + 8)
        assert.throws(() => extractCloudZip(data, root), /Encrypted, linked/)
        assert.deepEqual(fs.readdirSync(root), [])
      }
    }))

  it('rejects corrupt CRC and truncated ZIP before extracting files', () =>
    target((root) => {
      const badCRC = zip({ 'index.html': 'test' })
      badCRC.writeUInt32LE(0, central(badCRC) + 16)
      for (const bytes of [badCRC, zip({ 'index.html': 'test' }).subarray(0, 15), Buffer.from('not a zip')]) {
        assert.throws(() => extractCloudZip(bytes, root), /Corrupt|Invalid/)
        assert.deepEqual(fs.readdirSync(root), [])
      }
    }))

  it('enforces archive size, expanded size and entry count limits', () =>
    target((root) => {
      assert.throws(() => extractCloudZip(Buffer.alloc(20 * 1024 * 1024 + 1), root), /20 MiB/)
      const expanded = zip({ 'index.html': 'small' })
      expanded.writeUInt32LE(64 * 1024 * 1024 + 1, central(expanded) + 24)
      assert.throws(() => extractCloudZip(expanded, root), /Oversized/)
      const count = zip({ 'index.html': 'small' }),
        end = count.length - 22
      count.writeUInt16LE(2001, end + 8)
      count.writeUInt16LE(2001, end + 10)
      assert.throws(() => extractCloudZip(count, root), /oversized/)
      assert.deepEqual(fs.readdirSync(root), [])
    }))
})
