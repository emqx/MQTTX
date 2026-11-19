import { CloudError } from '../../utils/cloudErrors'
import type { CloudAuth } from './auth'

export async function cloudGet(
  origin: string,
  path: string,
  auth: Pick<CloudAuth, 'credential' | 'validate' | 'reject'>,
  lifetime: AbortSignal,
): Promise<unknown> {
  const { value, generation } = auth.credential()
  const checkSession = (): void => {
    if (lifetime.aborted || !auth.validate(generation)) throw new CloudError('SESSION_CHANGED')
  }
  const controller = new AbortController()
  try {
    const response = await fetch(origin + path, {
      headers: { Authorization: `Bearer ${value}` },
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.any([lifetime, AbortSignal.timeout(10000), controller.signal]),
    })
    checkSession()
    if (response.status === 401) {
      auth.reject(generation)
      throw new CloudError('AUTH_REJECTED')
    }
    if (response.status === 403) throw new CloudError('SCOPE_DENIED')
    if (response.status === 429) {
      const retry = response.headers.get('retry-after') || ''
      throw /^\d{1,6}$/.test(retry)
        ? new CloudError('RATE_LIMITED_RETRY', { seconds: Number(retry) })
        : new CloudError('RATE_LIMITED')
    }
    if (!response.ok) throw new CloudError('CLOUD_UNAVAILABLE')
    if (!response.body) throw new CloudError('RESPONSE_INVALID')
    const reader = response.body.getReader()
    const chunks: Buffer[] = []
    let size = 0
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.length
      if (size > 2 * 1024 * 1024) throw new CloudError('RESPONSE_TOO_LARGE')
      chunks.push(Buffer.from(part.value))
    }
    checkSession()
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      throw new CloudError('RESPONSE_INVALID')
    }
  } catch (error) {
    if (error instanceof CloudError) throw error
    checkSession()
    throw new CloudError('CLOUD_UNREACHABLE')
  } finally {
    controller.abort()
  }
}
