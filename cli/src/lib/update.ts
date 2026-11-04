import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { exec, execFile, execFileSync, spawnSync } from 'child_process'
import { promisify } from 'util'
import { compareVersions } from 'compare-versions'
import ora from 'ora'
import { version } from '../../package.json'
import { getLatestVersion } from '../utils/checkUpdate'

const packageRoot = path.resolve(__dirname, '../../..')
// cmd.exe searches the current directory first, so never resolve commands from a possibly untrusted one.
const trustedCwd = () => (process.platform === 'win32' ? path.dirname(process.execPath) : undefined)

export const getAssetName = (platform: NodeJS.Platform, arch: string, musl = false): string => {
  if (!['darwin', 'linux', 'win32'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
    throw new Error(`No MQTTX CLI binary is available for ${platform}/${arch}.`)
  }
  const os = platform === 'darwin' ? 'macos' : platform === 'win32' ? 'win' : musl ? 'alpine' : 'linux'
  return `mqttx-cli-${os}-${arch}${platform === 'win32' ? '.exe' : ''}`
}

export const findChecksum = (sums: string, fileName: string): string | null => {
  for (const line of sums.split(/\r?\n/)) {
    const match = line.trim().match(/^([0-9a-fA-F]{64})\s+\*?(.+)$/)
    if (match && match[2] === fileName) {
      return match[1].toLowerCase()
    }
  }
  return null
}

export const detectChannel = (root = packageRoot) => {
  if ('pkg' in process) {
    return fs.realpathSync(process.execPath).includes('/Cellar/') ? 'homebrew' : 'binary'
  }
  try {
    const npmRoot = execFileSync('npm', ['root', '-g'], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: trustedCwd(),
    }).trim()
    if (root === path.join(fs.realpathSync(npmRoot), 'mqttx-cli')) {
      return 'npm'
    }
  } catch (_) {
    // A missing npm or global root leaves this copy unmanaged.
  }
  return 'unmanaged'
}

const download = async (url: string): Promise<Response> => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response
  } catch (error) {
    const err = error as Error & { cause?: Error }
    throw new Error(`Cannot download ${url}: ${err.cause?.message || err.message}`)
  }
}

export const installBinary = async (execPath: string, latest: string): Promise<void> => {
  const target = fs.realpathSync(execPath)
  const directory = path.dirname(target)
  const musl =
    process.platform === 'linux' &&
    (process.report!.getReport() as unknown as { header: { glibcVersionRuntime?: string } }).header
      .glibcVersionRuntime === undefined
  const asset = getAssetName(process.platform, process.arch, musl)
  const temp = path.join(directory, `.mqttx-update-${process.pid}${path.extname(asset)}`)
  try {
    const sums = await download(`https://github.com/emqx/MQTTX/releases/download/v${latest}/SHA256SUMS`)
    const checksum = findChecksum(await sums.text(), asset)
    if (!checksum) {
      throw new Error(`Cannot verify the MQTTX CLI download: no checksum for ${asset}`)
    }
    const response = await download(`https://www.emqx.com/en/downloads/MQTTX/v${latest}/${asset}`)
    const binary = Buffer.from(await response.arrayBuffer())
    if (createHash('sha256').update(binary).digest('hex') !== checksum) {
      throw new Error(`SHA-256 checksum mismatch for ${asset}`)
    }
    fs.writeFileSync(temp, binary, { flag: 'wx' })
    fs.chmodSync(temp, fs.statSync(target).mode & 0o777)
    const { stdout } = await promisify(execFile)(temp, ['--version'], { timeout: 30000 })
    if (stdout.split(/\r?\n/)[0] !== latest) {
      throw new Error(`Downloaded MQTTX CLI did not report version ${latest}.`)
    }
    if (process.platform === 'win32') {
      const old = `${target}.old`
      fs.renameSync(target, old)
      try {
        fs.renameSync(temp, target)
      } catch (error) {
        fs.renameSync(old, target)
        throw error
      }
    } else {
      fs.renameSync(temp, target)
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      const instruction =
        process.platform === 'win32' ? 're-run from an elevated terminal' : 're-run with sudo mqttx update'
      throw new Error(`Cannot update MQTTX CLI in ${directory}: permission denied; ${instruction}.`)
    }
    throw error
  } finally {
    try {
      fs.unlinkSync(temp)
    } catch (_) {
      // The staged executable is already renamed or was never written.
    }
  }
}

const runCommand = (command: string, args: string[]): void => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: trustedCwd() })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.signal || result.status}).`)
  }
}

export const update = async (): Promise<void> => {
  const spinner = ora('Checking for updates...').start()
  try {
    const latest = await getLatestVersion()
    if (compareVersions(latest, version) <= 0) {
      spinner.succeed(`MQTTX CLI is already up to date (${version}).`)
      return
    }
    const channel = detectChannel()
    const prefix = channel === 'homebrew' ? fs.realpathSync(process.execPath).split('/Cellar/')[0] : ''
    if (channel === 'binary') {
      spinner.text = `Downloading and verifying MQTTX CLI ${latest}...`
      await installBinary(process.execPath, latest)
    } else if (channel === 'homebrew') {
      spinner.stop()
      runCommand('brew', ['update'])
      runCommand('brew', ['upgrade', 'emqx/mqttx/mqttx-cli'])
    } else if (channel === 'npm') {
      spinner.stop()
      runCommand('npm', ['install', '--global', `mqttx-cli@${latest}`])
    } else {
      throw new Error(
        `This copy of MQTTX CLI cannot update itself. Running from ${packageRoot}.\nhttps://mqttx.app/docs/cli/downloading-and-installation`,
      )
    }
    if (channel === 'homebrew' || channel === 'npm') {
      let installed: string
      if (channel === 'npm') {
        installed = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')).version
      } else {
        const executable = path.join(prefix, 'opt/mqttx-cli/bin/mqttx').replace(/'/g, "'\\''")
        // pkg forces PKG_EXECPATH onto children, and a child that is this same binary (the channel lagged) would run --version as a script.
        const { stdout } = await promisify(exec)(`PKG_EXECPATH= '${executable}' --version`, { timeout: 30000 })
        installed = stdout.split(/\r?\n/)[0]
      }
      if (installed !== latest) {
        throw new Error(
          `The ${channel} update finished, but the installed MQTTX CLI is ${installed}, not ${latest}. ` +
            'The release may not be published there yet; try again later.',
        )
      }
    }
    spinner.succeed(`Updated MQTTX CLI ${version} → ${latest}\nhttps://mqttx.app/changelogs/v${latest}`)
  } catch (error) {
    spinner.fail((error as Error).message)
    process.exitCode = 1
  }
}
