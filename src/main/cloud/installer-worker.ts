import { parentPort, workerData } from 'worker_threads'
import fs from 'fs'
import { createHash } from 'crypto'
import { extractCloudZip } from './package'
import { inspect } from './manifest'
import { CloudError, cloudIssue } from '../../utils/cloudErrors'
import { cloudDiagnostic } from './diagnostics'
import type { InstallRequest, InstallResponse } from '../../types/cloud'

const data = workerData as InstallRequest
function install(): InstallResponse {
  try {
    const bytes = Buffer.from(data.bytes)
    if (createHash('sha256').update(bytes).digest('hex') !== data.hash) throw new CloudError('CHECKSUM_MISMATCH')
    fs.mkdirSync(data.directory, { recursive: true })
    try {
      extractCloudZip(bytes, data.directory)
    } catch (cause) {
      const error = new CloudError('PACKAGE_INVALID')
      Object.assign(error, { cause })
      throw error
    }
    const manifest = inspect(data.directory)
    if (manifest.version !== data.version) throw new CloudError('VERSION_MISMATCH')
    return { ok: true, manifest }
  } catch (error) {
    return { ok: false, error: cloudIssue(error, 'PACKAGE_INVALID'), diagnostic: cloudDiagnostic(error) }
  }
}
parentPort?.postMessage(install())
