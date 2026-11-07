import { CloudError } from '../../utils/cloudErrors'
import type { CloudMethod, CloudRequest } from '../../types/cloud'

const methods: CloudMethod[] = [
  'login',
  'logout',
  'cancel',
  'status',
  'enter',
  'add',
  'retry',
  'remove',
  'leave',
  'mounting',
  'ready',
  'unmount',
  'credential',
  'validate',
  'reject',
]
export function parseCloudRequest(method: unknown, value: unknown = {}): CloudRequest {
  if (
    typeof method !== 'string' ||
    !methods.includes(method as CloudMethod) ||
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  )
    throw new CloudError('OPERATION_DENIED')
  const args = value as Record<string, unknown>
  if (
    ['mounting', 'ready', 'unmount', 'credential', 'validate', 'reject'].includes(method) &&
    (typeof args.id !== 'string' || !/^r-[a-f0-9-]{36}$/.test(args.id))
  )
    throw new CloudError('OPERATION_DENIED')
  if (method === 'login' && (typeof args.locale !== 'string' || args.locale.length > 16))
    throw new CloudError('OPERATION_DENIED')
  if (
    (method === 'validate' || method === 'reject') &&
    (typeof args.generation !== 'number' || !Number.isSafeInteger(args.generation))
  )
    throw new CloudError('OPERATION_DENIED')
  return { method, args } as CloudRequest
}
