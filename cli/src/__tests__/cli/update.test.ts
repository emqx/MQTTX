import fs from 'fs'
import os from 'os'
import path from 'path'
import childProcess from 'child_process'
import { promisify } from 'util'
import { createHash } from 'crypto'
import ora from 'ora'
import { detectChannel, findChecksum, getAssetName, installBinary, update } from '../../lib/update'
import { getLatestVersion, checkUpdate } from '../../utils/checkUpdate'
import { version } from '../../../package.json'

jest.mock('ora', () => {
  const spinner = { start: jest.fn().mockReturnThis(), stop: jest.fn(), succeed: jest.fn(), fail: jest.fn(), text: '' }
  return () => spinner
})
const spinner = ora()
const latest = '99.0.0'
const asset = getAssetName(process.platform, process.arch)
const binary = Buffer.from(`#!/bin/sh\nprintf '${latest}\\nhttps://mqttx.app/changelogs/v${latest}\\n'\n`)
const checksum = createHash('sha256').update(binary).digest('hex')
const runtime = Object.getOwnPropertyDescriptors(process)
let fetchMock: jest.SpyInstance
let previousExitCode: typeof process.exitCode

beforeEach(() => {
  jest.clearAllMocks()
  previousExitCode = process.exitCode
  fetchMock = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected network request'))
})
afterEach(() => {
  jest.restoreAllMocks()
  Object.defineProperty(process, 'platform', runtime.platform)
  Object.defineProperty(process, 'arch', runtime.arch)
  Reflect.deleteProperty(process, 'pkg')
  process.exitCode = previousExitCode
})

const mockLatest = (remote = latest) =>
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ data: [`v${remote}`] })))
const mockDownload = (name = asset, sum = checksum) =>
  fetchMock.mockResolvedValueOnce(new Response(`${sum}  ${name}\n`)).mockResolvedValueOnce(new Response(binary))
const mockVersion = (method: 'exec' | 'execFile', installed = latest) => {
  const run = jest.fn().mockResolvedValue({ stdout: `${installed}\r\n`, stderr: '' })
  Object.defineProperty(jest.spyOn(childProcess, method), promisify.custom, {
    value: run,
  })
  return run
}
const spawnResult = (status = 0) => ({ pid: 1, output: [], stdout: '', stderr: '', signal: null, status })
const mockHomebrew = () => {
  Object.defineProperty(process, 'pkg', { configurable: true, value: {} })
  jest.spyOn(fs, 'realpathSync').mockReturnValue('/opt/homebrew/Cellar/mqttx-cli/1.0.0/bin/mqttx')
}
const mockNpm = () => {
  const root = path.dirname(path.resolve(__dirname, '../../../..'))
  jest.spyOn(childProcess, 'execFileSync').mockReturnValue(root)
  jest.spyOn(fs, 'realpathSync').mockReturnValue(root)
  // Source tests resolve above cli, so map the global package path to that source root.
  const join = path.join
  jest
    .spyOn(path, 'join')
    .mockImplementation((...parts) =>
      parts[0] === root && parts[1] === 'mqttx-cli' ? path.resolve(__dirname, '../../../..') : join(...parts),
    )
}

describe('update helpers', () => {
  it.each<[NodeJS.Platform, string, boolean, string]>([
    ['darwin', 'arm64', false, 'mqttx-cli-macos-arm64'],
    ['linux', 'x64', false, 'mqttx-cli-linux-x64'],
    ['linux', 'arm64', true, 'mqttx-cli-alpine-arm64'],
    ['win32', 'x64', false, 'mqttx-cli-win-x64.exe'],
  ])('selects the asset for %s/%s (musl: %s)', (platform, arch, musl, name) => {
    expect(getAssetName(platform, arch, musl)).toBe(name)
  })
  it('rejects unsupported platforms and architectures', () => {
    expect(() => getAssetName('linux', 'ia32')).toThrow('linux/ia32')
    expect(() => getAssetName('freebsd', 'x64')).toThrow('freebsd/x64')
  })
  it('matches exact checksum filenames, optional * and uppercase hex', () => {
    const sums = `${'a'.repeat(64)}  ${asset}.extra\r\n${checksum.toUpperCase()} *${asset}\r\n`
    expect(findChecksum(sums, asset)).toBe(checksum)
    expect(findChecksum(`${checksum}  ${asset}`, asset)).toBe(checksum)
    expect(findChecksum(sums, 'missing-asset')).toBeNull()
  })
  it('shares the latest lookup with check and suggests update', async () => {
    mockLatest()
    expect(await getLatestVersion()).toBe(latest)
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    await checkUpdate()
    expect(log).toHaveBeenCalledWith(expect.stringContaining('mqttx update'))
  })
  it('rejects a non-OK latest version response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }))
    await expect(getLatestVersion()).rejects.toThrow('503')
  })
  it.each(['99.x', '99.0.0-beta.1', '>=99.0.0', '\u001b]52;c;malicious'])(
    'rejects unsafe version %j with a fixed message',
    async (remote) => {
      mockLatest(remote)
      const lookup = getLatestVersion()
      await expect(lookup).rejects.toHaveProperty('message', 'Invalid version received from the update service.')
      await expect(lookup).rejects.not.toThrow('\u001b')
    },
  )
})

describe('installation channel', () => {
  it.each([
    ['/Users/test/.local/share/mqttx-cli/mqttx', 'binary'],
    ['/usr/local/bin/mqttx', 'binary'],
    ['/opt/homebrew/Cellar/mqttx-cli/1.0.0/bin/mqttx', 'homebrew'],
  ])('detects %s as %s', (realPath, channel) => {
    Object.defineProperty(process, 'pkg', { configurable: true, value: {} })
    jest.spyOn(fs, 'realpathSync').mockReturnValue(realPath)
    expect(detectChannel()).toBe(channel)
  })
  it('accepts npm global and rejects npm-linked checkouts and pnpm copies', () => {
    const root = path.resolve(os.tmpdir(), 'npm-global', 'node_modules')
    jest.spyOn(childProcess, 'execFileSync').mockReturnValue(`${root}\n`)
    jest.spyOn(fs, 'realpathSync').mockReturnValue(root)
    expect(detectChannel(path.join(root, 'mqttx-cli'))).toBe('npm')
    expect(detectChannel(path.resolve(os.tmpdir(), 'checkout', 'cli'))).toBe('unmanaged')
    expect(detectChannel(path.join(root, '.pnpm', 'mqttx-cli'))).toBe('unmanaged')
  })
  it('leaves the copy unmanaged when npm root -g fails', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementation(() => {
      throw new Error('npm unavailable')
    })
    expect(detectChannel()).toBe('unmanaged')
  })
})

describe('binary installation', () => {
  let directory: string
  let target: string
  const original = Buffer.from('original executable\n')
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-update-test-'))
    target = path.join(directory, 'mqttx')
    fs.writeFileSync(target, original, { mode: 0o755 })
  })
  afterEach(() => {
    fs.chmodSync(directory, 0o755)
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const expectOriginal = () => {
    expect(fs.readFileSync(target)).toEqual(original)
    expect(fs.readdirSync(directory).filter((name) => name.startsWith('.mqttx-update-'))).toEqual([])
  }
  it('replaces the real file while preserving the symlink', async () => {
    mockDownload()
    const link = path.join(directory, 'link')
    fs.symlinkSync(target, link)
    await installBinary(link, latest)
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true)
    expect(fs.readlinkSync(link)).toBe(target)
    expect(fs.readFileSync(target)).toEqual(binary)
    expect(fs.statSync(target).mode & 0o777).toBe(0o755)
    expect(fs.readdirSync(directory).sort()).toEqual(['link', 'mqttx'])
  })
  it('preserves the executable mode under a strict umask', async () => {
    mockDownload()
    fs.chmodSync(target, 0o755)
    const previousUmask = process.umask(0o077)
    try {
      await installBinary(target, latest)
      expect(fs.statSync(target).mode & 0o777).toBe(0o755)
    } finally {
      process.umask(previousUmask)
    }
  })
  it('preserves the original on a checksum mismatch', async () => {
    mockDownload(asset, '0'.repeat(64))
    await expect(installBinary(target, latest)).rejects.toThrow('checksum mismatch')
    expectOriginal()
  })
  it('preserves the original on wrong version output', async () => {
    mockDownload()
    await expect(installBinary(target, '98.0.0')).rejects.toThrow('did not report version 98.0.0')
    expectOriginal()
  })
  it('names a read-only directory and suggests sudo', async () => {
    mockDownload()
    fs.chmodSync(directory, 0o555)
    await expect(installBinary(target, latest)).rejects.toThrow(
      `Cannot update MQTTX CLI in ${fs.realpathSync(directory)}: permission denied; re-run with sudo mqttx update.`,
    )
    expectOriginal()
  })
  it.each<[string, Response[]]>([
    ['sums HTTP', [new Response('', { status: 404 })]],
    ['missing checksum', [new Response(`${checksum}  another-asset`)]],
    ['binary HTTP', [new Response(`${checksum}  ${asset}`), new Response('', { status: 500 })]],
  ])('preserves the original on %s failure', async (_, responses) => {
    for (const response of responses) fetchMock.mockResolvedValueOnce(response)
    await expect(installBinary(target, latest)).rejects.toThrow()
    expectOriginal()
  })
  it('includes the URL and network cause in download errors', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('fetch failed'), { cause: new Error('blocked') }))
    await expect(installBinary(target, latest)).rejects.toThrow(
      `Cannot download https://github.com/emqx/MQTTX/releases/download/v${latest}/SHA256SUMS: blocked`,
    )
    expectOriginal()
  })
  describe('Windows swap', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
      Object.defineProperty(process, 'arch', { value: 'x64' })
      mockDownload(getAssetName(process.platform, process.arch))
      mockVersion('execFile')
    })
    it('swaps via .old', async () => {
      await installBinary(target, latest)
      expect(fs.readFileSync(target)).toEqual(binary)
      expect(fs.readFileSync(`${target}.old`)).toEqual(original)
      expect(fs.readdirSync(directory).sort()).toEqual(['mqttx', 'mqttx.old'])
    })
    it('rolls back a failed second rename and cleans up the temp file', async () => {
      const rename = fs.renameSync
      jest
        .spyOn(fs, 'renameSync')
        .mockImplementationOnce(rename)
        .mockImplementationOnce(() => {
          throw Object.assign(new Error('locked'), { code: 'EPERM' })
        })
      await expect(installBinary(target, latest)).rejects.toThrow('elevated terminal')
      expectOriginal()
      expect(fs.existsSync(`${target}.old`)).toBe(false)
    })
  })
})

describe('update command', () => {
  beforeEach(() => mockLatest())
  it.each([version, '1.0.0'])('never changes an installation when latest is %s', async (remote) => {
    mockLatest(remote)
    const spawn = jest.spyOn(childProcess, 'spawnSync')
    await update()
    expect(spinner.succeed).toHaveBeenCalledWith(`MQTTX CLI is already up to date (${version}).`)
    expect(spawn).not.toHaveBeenCalled()
  })
  it('reports the path and installation guide for unmanaged copies', async () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementation(() => {
      throw new Error('npm unavailable')
    })
    await update()
    expect(process.exitCode).toBe(1)
    expect(spinner.fail).toHaveBeenCalledWith(
      expect.stringMatching(
        /cannot update itself\. Running from .+\nhttps:\/\/github.com\/emqx\/MQTTX\/blob\/main\/INSTALL.md/,
      ),
    )
  })
  it('runs Homebrew update and upgrade, then reports the verified version', async () => {
    mockHomebrew()
    const spawn = jest.spyOn(childProcess, 'spawnSync').mockReturnValue(spawnResult())
    mockVersion('exec')
    await update()
    expect(spawn.mock.calls).toEqual([
      ['brew', ['update'], { stdio: 'inherit', shell: false, cwd: undefined }],
      ['brew', ['upgrade', 'emqx/mqttx/mqttx-cli'], { stdio: 'inherit', shell: false, cwd: undefined }],
    ])
    expect(spinner.succeed).toHaveBeenCalledWith(
      `Updated MQTTX CLI ${version} → ${latest}\nhttps://mqttx.app/changelogs/v${latest}`,
    )
  })
  it('fails without upgrading when brew update exits nonzero', async () => {
    mockHomebrew()
    const spawn = jest.spyOn(childProcess, 'spawnSync').mockReturnValue(spawnResult(1))
    await update()
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spinner.fail).toHaveBeenCalledWith(expect.stringContaining('brew update failed'))
    expect(process.exitCode).toBe(1)
  })
  it.each(['win32', 'linux'])('uses a trusted child cwd for the npm flow on %s', async (platform) => {
    Object.defineProperty(process, 'platform', { value: platform })
    mockNpm()
    const spawn = jest.spyOn(childProcess, 'spawnSync').mockReturnValue(spawnResult())
    const versionCheck = mockVersion('exec')
    const cwd = platform === 'win32' ? path.dirname(process.execPath) : undefined
    await update()
    expect(childProcess.execFileSync).toHaveBeenCalledWith('npm', ['root', '-g'], expect.objectContaining({ cwd }))
    expect(spawn).toHaveBeenCalledWith('npm', ['install', '--global', 'mqttx-cli@latest'], {
      stdio: 'inherit',
      shell: platform === 'win32',
      cwd,
    })
    expect(versionCheck).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cwd }))
    expect(spinner.succeed).toHaveBeenCalled()
  })
  it.each<[string, () => void]>([
    ['homebrew', mockHomebrew],
    ['npm', mockNpm],
  ])('fails when %s finishes but mqttx still reports the old version', async (channel, selectChannel) => {
    selectChannel()
    jest.spyOn(childProcess, 'spawnSync').mockReturnValue(spawnResult())
    mockVersion('exec', version)
    await update()
    expect(spinner.fail).toHaveBeenCalledWith(
      `The ${channel} channel finished, but mqttx reports ${version} rather than ${latest}. ` +
        'The channel may not have published the release yet, or another mqttx comes first on PATH.',
    )
    expect(process.exitCode).toBe(1)
    expect(spinner.succeed).not.toHaveBeenCalled()
  })
  it('reports lookup failures and exits unsuccessfully', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await update()
    expect(spinner.fail).toHaveBeenCalledWith('offline')
    expect(process.exitCode).toBe(1)
  })
})
