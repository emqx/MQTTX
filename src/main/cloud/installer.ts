import { Worker } from 'worker_threads'
import path from 'path'
import { CloudError, cloudError } from '../../utils/cloudErrors'
import { logCloudFailure, logCloudDiagnostic } from './diagnostics'
import type { CloudManifest, InstallRequest, InstallResponse } from '../../types/cloud'

export function installCloudPackage(
  data: InstallRequest,
  signal: AbortSignal,
  workerPath = path.join(__dirname, 'cloud-install-worker.js'),
): Promise<CloudManifest> {
  return new Promise((resolve, reject) => {
    const bytes = Uint8Array.from(data.bytes)
    const worker = new Worker(workerPath, {
      workerData: { ...data, bytes },
      transferList: [bytes.buffer],
      execArgv: [],
    })
    let settled = false
    const finish = async (error?: Error, manifest?: CloudManifest): Promise<void> => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', abort)
      await worker.terminate()
      error ? reject(error) : resolve(manifest!)
    }
    const abort = () => {
      void finish(new CloudError('EXTENSION_STOPPED'))
    }
    worker.on('message', (result: InstallResponse) => {
      if (result.ok) void finish(undefined, result.manifest)
      else {
        logCloudDiagnostic('install', result.diagnostic)
        void finish(cloudError(result.error))
      }
    })
    worker.on('error', (error) => {
      logCloudFailure('install worker', error)
      void finish(new CloudError('PACKAGE_INVALID'))
    })
    worker.on('exit', () => {
      if (!settled) void finish(new CloudError('PACKAGE_INVALID'))
    })
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}
