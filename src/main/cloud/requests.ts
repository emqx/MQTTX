import { parseCloudConnection } from '../../utils/cloudConnection'
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
  'connect',
  'ready',
  'unmount',
  'request',
  'createConnection',
  'copyConnection',
  'copyText',
  'requestRemove',
]
const documentMethods = ['ready', 'request', 'createConnection', 'copyConnection', 'copyText', 'requestRemove']
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
    (['mounting', 'connect', 'unmount'].includes(method) || documentMethods.includes(method)) &&
    (typeof args.id !== 'string' || !/^r-[a-f0-9-]{36}$/.test(args.id))
  )
    throw new CloudError('OPERATION_DENIED')
  if (documentMethods.includes(method) && (typeof args.document !== 'string' || !/^[a-f0-9-]{36}$/.test(args.document)))
    throw new CloudError('OPERATION_DENIED')
  const page = { id: args.id as string, document: args.document as string }
  if (method === 'login' && (typeof args.locale !== 'string' || args.locale.length > 16))
    throw new CloudError('OPERATION_DENIED')
  if (method === 'request') {
    if (
      args.method !== 'GET' ||
      typeof args.path !== 'string' ||
      args.path.length > 4096 ||
      !/^\/public_api\/v1\/mqttx\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*(?:\?[^#\s]*)?$/.test(args.path)
    )
      throw new CloudError('OPERATION_DENIED')
    return { method, args: { ...page, method: 'GET', path: args.path } }
  }
  if (method === 'copyText') {
    if (typeof args.text !== 'string' || !args.text || args.text.length > 4096) throw new CloudError('OPERATION_DENIED')
    return { method, args: { ...page, text: args.text } }
  }
  if (method === 'createConnection' || method === 'copyConnection')
    return { method, args: { ...page, connection: parseCloudConnection(args.connection) } }
  return { method, args } as CloudRequest
}
