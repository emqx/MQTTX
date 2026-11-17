import { assert } from 'chai'
import childProcess from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { CloudDeviceIdentity, readSystemMachineId } from '../../../src/main/cloud/device'
import { CredentialStore } from '../../../src/main/cloud/storage'
import { expectRejection } from './assertions'

describe('Cloud device identity', () => {
  let root: string
  let saved: string | null
  let credential: { getPassword(): Promise<string | null>; setPassword(value: string): Promise<void> }
  let originalLog: typeof console.error
  const identity = (reader = async () => '550e8400e29b41d4a716446655440000') =>
    new CloudDeviceIdentity(reader, () => credential)
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-device-'))
    saved = null
    credential = {
      getPassword: async () => saved,
      setPassword: async (value) => {
        saved = value
      },
    }
    originalLog = console.error
    console.error = () => {}
  })
  afterEach(() => {
    console.error = originalLog
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('derives the same UUID after app data deletion and normalizes the system identifier', async () => {
    const first = await identity(async () => '550E8400-E29B-41D4-A716-446655440000\n').get()
    assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    fs.rmSync(root, { recursive: true, force: true })
    assert.strictEqual(await identity().get(), first)
    assert.notStrictEqual(first, await identity(async () => '650e8400e29b41d4a716446655440000').get())
    assert.isNull(saved)
  })

  it('persists one fallback in credentials across concurrent calls and application data deletion', async () => {
    let reads = 0
    const current = identity(async () => {
      reads++
      throw new Error('System identity unavailable')
    })
    const [first, second] = await Promise.all([current.get(), current.get()])
    assert.strictEqual(first, second)
    assert.strictEqual(reads, 1)
    assert.strictEqual(saved, first)
    assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    fs.rmSync(root, { recursive: true, force: true })
    assert.strictEqual(
      await identity(async () => {
        throw new Error('System source must not be consulted')
      }).get(),
      first,
    )
    assert.strictEqual(await identity().get(), first)
  })

  for (const value of ['', 'unknown', 'work-laptop', '0'.repeat(32), 'f'.repeat(32)]) {
    it(`stores a fallback credential for an unavailable machine identifier (${value || 'empty'})`, async () => {
      const result = await identity(async () => value).get()
      assert.strictEqual(saved, result)
    })
  }

  it('retains the fallback when account credentials are cleared', async () => {
    const first = await identity(async () => '').get()
    const credentials = new CredentialStore(
      path.join(root, 'cloud'),
      {
        isEncryptionAvailable: () => false,
        getSelectedStorageBackend: () => '',
        encryptString: () => Buffer.alloc(0),
        decryptString: () => '',
      },
      'test',
    )
    credentials.clear()
    assert.strictEqual(await identity().get(), first)
  })

  it('does not mistake credential read failures for missing records even when the system ID is readable', async () => {
    let machineReads = 0
    let writes = 0
    credential.getPassword = async () => {
      throw new Error('Credential store locked')
    }
    credential.setPassword = async () => {
      writes++
    }
    await expectRejection(
      identity(async () => {
        machineReads++
        return '550e8400e29b41d4a716446655440000'
      }).get(),
      { code: 'DEVICE_ID_UNAVAILABLE' },
    )
    assert.strictEqual(machineReads, 0)
    assert.strictEqual(writes, 0)
  })

  it('handles native credential initialization failures as a Cloud login error', async () => {
    const current = new CloudDeviceIdentity(
      async () => '',
      () => {
        throw new Error('Store unavailable')
      },
    )
    await expectRejection(current.get(), { code: 'DEVICE_ID_UNAVAILABLE' })
  })

  it('rejects invalid stored credentials instead of generating a replacement', async () => {
    for (const invalid of ['', 'unknown', '{}']) {
      saved = invalid
      await expectRejection(identity().get(), { code: 'DEVICE_ID_UNAVAILABLE' })
      assert.strictEqual(saved, invalid)
    }
  })

  it('does not return an unsaved fallback and can retry after credential writes recover', async () => {
    credential.setPassword = async () => {
      throw new Error('Credential write failed')
    }
    const current = identity(async () => '')
    await expectRejection(current.get(), { code: 'DEVICE_ID_UNAVAILABLE' })
    assert.isNull(saved)
    credential.setPassword = async (value) => {
      saved = value
    }
    assert.strictEqual(await current.get(), saved)
  })

  it('does not put raw identifiers or credential errors in diagnostics', async () => {
    const records: unknown[] = []
    console.error = (...values: unknown[]) => {
      records.push(values)
    }
    await identity(async () => {
      throw new Error('private-machine-identifier')
    }).get()
    credential.getPassword = async () => {
      throw new Error('private-credential-value')
    }
    await expectRejection(identity().get(), { code: 'DEVICE_ID_UNAVAILABLE' })
    assert.isNotEmpty(records)
    assert.notMatch(JSON.stringify(records), /private-machine-identifier|private-credential-value/)
  })
})

describe('System machine identity readers', () => {
  it('reads macOS and Windows identities using bounded commands without a shell', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
    const original = childProcess.execFile
    try {
      for (const [target, output, expected] of [
        [
          'darwin',
          '    "IOPlatformUUID" = "550E8400-E29B-41D4-A716-446655440000"',
          '550E8400-E29B-41D4-A716-446655440000',
        ],
        [
          'win32',
          '    MachineGuid    REG_SZ    550e8400-e29b-41d4-a716-446655440000\r\n',
          '550e8400-e29b-41d4-a716-446655440000',
        ],
      ]) {
        Object.defineProperty(process, 'platform', { value: target })
        childProcess.execFile = ((
          executable: string,
          args: string[],
          options: childProcess.ExecFileOptions,
          callback: (error: Error | null, stdout: string) => void,
        ) => {
          assert.strictEqual(options.timeout, 3000)
          assert.strictEqual(options.windowsHide, true)
          assert.isUndefined(options.shell)
          if (target === 'darwin') {
            assert.strictEqual(executable, '/usr/sbin/ioreg')
            assert.deepEqual(args, ['-rd1', '-c', 'IOPlatformExpertDevice'])
          } else {
            assert.include(executable, 'reg.exe')
            assert.include(args, '/reg:64')
          }
          callback(null, output)
          return new childProcess.ChildProcess()
        }) as typeof childProcess.execFile
        assert.strictEqual(await readSystemMachineId(), expected)
      }
      childProcess.execFile = ((
        _executable: string,
        _args: string[],
        _options: childProcess.ExecFileOptions,
        callback: (error: Error) => void,
      ) => {
        callback(Object.assign(new Error('Timed out'), { code: 'ETIMEDOUT' }))
        return new childProcess.ChildProcess()
      }) as typeof childProcess.execFile
      await expectRejection(readSystemMachineId(), { code: 'ETIMEDOUT' })
    } finally {
      Object.defineProperty(process, 'platform', platform)
      childProcess.execFile = original
    }
  })

  it('reads the Linux machine-id and uses the D-Bus file only when the primary file is absent', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
    const readFile = fs.promises.readFile
    const paths: string[] = []
    try {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      fs.promises.readFile = (async (file: string) => {
        paths.push(file)
        if (file === '/etc/machine-id') throw Object.assign(new Error(), { code: 'ENOENT' })
        return '550e8400e29b41d4a716446655440000\n'
      }) as typeof fs.promises.readFile
      assert.strictEqual(await readSystemMachineId(), '550e8400e29b41d4a716446655440000\n')
      assert.deepEqual(paths, ['/etc/machine-id', '/var/lib/dbus/machine-id'])
      paths.length = 0
      fs.promises.readFile = (async (file: string) => {
        paths.push(file)
        throw Object.assign(new Error(), { code: 'EACCES' })
      }) as typeof fs.promises.readFile
      await expectRejection(readSystemMachineId(), { code: 'EACCES' })
      assert.deepEqual(paths, ['/etc/machine-id'])
    } finally {
      Object.defineProperty(process, 'platform', platform)
      fs.promises.readFile = readFile
    }
  })
})
