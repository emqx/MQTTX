import path from 'path'
import type { CloudDiagnostic } from '../../types/cloud'

// Keep failure identity and source locations, never arbitrary messages, URLs, headers or credentials.
export function cloudDiagnostic(error: unknown, depth = 0): CloudDiagnostic {
  const value = error instanceof Error ? error : new Error()
  const details = value as Error & { code?: unknown; syscall?: unknown; path?: unknown; cause?: unknown }
  const cause = depth < 4 && details.cause instanceof Error ? cloudDiagnostic(details.cause, depth + 1) : undefined
  const name = ['Error', 'TypeError', 'SyntaxError', 'RangeError', 'AbortError', 'CloudError'].includes(value.name)
    ? value.name
    : 'Error'
  const code = typeof details.code === 'string' && /^[A-Z_]{2,40}$/.test(details.code) ? details.code : cause?.code
  const syscall =
    typeof details.syscall === 'string' && /^[a-z]{1,20}$/.test(details.syscall) ? details.syscall : undefined
  const file =
    typeof details.path === 'string' ? path.basename(details.path).replace(/[^a-zA-Z0-9_.-]/g, '_') : undefined
  const frames = (value.stack || '')
    .split('\n')
    .slice(1)
    .flatMap((line) => {
      const match = line.match(/([^/\\\s():]+\.[cm]?[jt]s):(\d+):(\d+)/)
      return match ? [`${match[1]}:${match[2]}:${match[3]}`] : []
    })
    .slice(0, 4)
  return { name, code, syscall, file, frames }
}
export function logCloudFailure(stage: string, error: unknown): void {
  console.error(`[Cloud] ${stage}`, cloudDiagnostic(error))
}
export function logCloudDiagnostic(stage: string, diagnostic: CloudDiagnostic): void {
  console.error(`[Cloud] ${stage}`, diagnostic)
}
