import fs from 'fs'
import path from 'path'
import { compareVersions } from 'compare-versions'
import { CloudError } from '../../utils/cloudErrors'
import type { CloudManifest } from '../../types/cloud'

export function releaseVersion(value: unknown): asserts value is string {
  // Cloud currently publishes stable three-part versions; comparison itself is shared with app updates.
  if (typeof value !== 'string' || !/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(value)) throw new CloudError('PACKAGE_INVALID')
}
export function newer(a: string, b: string): boolean {
  releaseVersion(a)
  releaseVersion(b)
  return compareVersions(a, b) > 0
}
export function inspect(root: string): CloudManifest {
  const manifest: CloudManifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'))
  releaseVersion(manifest.version)
  if (
    manifest.id !== 'emqx.cloud' ||
    manifest.apiVersion !== 1 ||
    manifest.kind !== 'page' ||
    manifest.entry !== 'index.html' ||
    manifest.backend !== 'backend.cjs'
  )
    throw new CloudError('PACKAGE_INVALID')
  if (![manifest.entry, manifest.backend].every((file) => fs.statSync(path.join(root, file)).isFile()))
    throw new CloudError('PACKAGE_INVALID')
  return manifest
}
