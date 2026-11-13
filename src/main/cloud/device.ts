import childProcess from 'child_process'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import uuidV5 from 'uuid/v5'
import { CloudError } from '../../utils/cloudErrors'
import type { AsyncEntry } from '@napi-rs/keyring'
import { logCloudFailure } from './diagnostics'

// Permanent MQTTX Cloud namespace. Changing it would reidentify every device.
const DEVICE_NAMESPACE = '2287e2bc-034f-4b1e-bfd6-14f662a8b8e8'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[45][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** Read a system identifier without collecting hardware serial numbers or hostnames. */
export async function readSystemMachineId(): Promise<string> {
  if (process.platform === 'linux') {
    try {
      return await fs.promises.readFile('/etc/machine-id', 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      return fs.promises.readFile('/var/lib/dbus/machine-id', 'utf8')
    }
  }
  let executable: string
  let args: string[]
  let pattern: RegExp
  if (process.platform === 'darwin') {
    executable = '/usr/sbin/ioreg'
    args = ['-rd1', '-c', 'IOPlatformExpertDevice']
    pattern = /"IOPlatformUUID"\s*=\s*"([^"]+)"/
  } else if (process.platform === 'win32') {
    executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe')
    args = ['QUERY', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid', '/reg:64']
    pattern = /MachineGuid\s+REG_SZ\s+([^\r\n]+)/i
  } else {
    throw new Error('Unsupported device platform')
  }
  const output = await new Promise<string>((resolve, reject) => {
    childProcess.execFile(executable, args, { timeout: 3000, windowsHide: true }, (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })
  const match = output.match(pattern)
  if (!match) throw new Error('System device identifier is unavailable')
  return match[1]
}

type DeviceCredential = Pick<AsyncEntry, 'getPassword' | 'setPassword'>

function createDeviceCredential(): DeviceCredential {
  // Load the native binding during login, so unavailable credentials cannot break MQTT startup.
  const { AsyncEntry } = require('@napi-rs/keyring') as typeof import('@napi-rs/keyring')
  // The kernel keyring fallback on Linux is not persistent across reboots.
  return new AsyncEntry('MQTTX Cloud', 'device-id', { linux: { store: 'secret-service' } })
}

/** Resolve one device identity, keeping a persisted fallback stable across logins. */
export class CloudDeviceIdentity {
  private pending: Promise<string> | undefined

  constructor(
    private readonly legacyFile: string,
    private readonly readMachineId = readSystemMachineId,
    private readonly getCredential = createDeviceCredential,
  ) {}

  get(): Promise<string> {
    if (!this.pending) {
      this.pending = this.resolve().catch((error) => {
        this.pending = undefined
        throw error
      })
    }
    return this.pending
  }

  private async resolve(): Promise<string> {
    try {
      // A read failure must not be mistaken for absence: an established fallback may be locked.
      const credential = this.getCredential()
      const stored = await credential.getPassword()
      if (stored !== null) {
        this.validateDeviceId(stored)
        await this.removeLegacyFile()
        return stored
      }

      let legacy: string | undefined
      try {
        legacy = await fs.promises.readFile(this.legacyFile, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      if (legacy !== undefined) {
        const data: unknown = JSON.parse(legacy)
        if (typeof data !== 'object' || data === null || !('deviceID' in data))
          throw new Error('Invalid legacy device identity')
        const deviceID = data.deviceID
        this.validateDeviceId(deviceID)
        // Persist the same identity before deleting the old file, including after a failed migration.
        await credential.setPassword(deviceID)
        await this.removeLegacyFile()
        return deviceID
      }

      let machineId: string
      try {
        machineId = (await this.readMachineId()).trim().toLowerCase().replace(/-/g, '')
        if (!/^[0-9a-f]{32}$/.test(machineId) || /^(0{32}|f{32})$/.test(machineId))
          throw new Error('Invalid system device identifier')
      } catch (error) {
        logCloudFailure('system device identity', error)
        const deviceID = randomUUID()
        await credential.setPassword(deviceID)
        return deviceID
      }
      return uuidV5(`${process.platform}:${machineId}`, DEVICE_NAMESPACE)
    } catch (error) {
      logCloudFailure('device identity', error)
      throw new CloudError('DEVICE_ID_UNAVAILABLE')
    }
  }

  private validateDeviceId(value: unknown): asserts value is string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new Error('Invalid device identity')
  }

  private async removeLegacyFile(): Promise<void> {
    try {
      await fs.promises.unlink(this.legacyFile)
    } catch (error) {
      // Credentials are already durable; a cleanup failure must not discard their identity.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') logCloudFailure('legacy device identity cleanup', error)
    }
  }
}
