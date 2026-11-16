import { CloudError } from './cloudErrors'
import type { CloudConnectionDraft } from '../types/cloud'

// Only these fields can cross from the extension into a new connection form.
export function parseCloudConnection(value: unknown): CloudConnectionDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CloudError('OPERATION_DENIED')
  const { name, host, port, protocol } = value as Record<string, unknown>
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.length > 256 ||
    typeof host !== 'string' ||
    !host ||
    host.length > 253 ||
    typeof port !== 'number' ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    (protocol !== 'mqtt' && protocol !== 'mqtts' && protocol !== 'ws' && protocol !== 'wss')
  )
    throw new CloudError('OPERATION_DENIED')
  let url: URL
  try {
    url = new URL(`https://${host}`)
  } catch {
    throw new CloudError('OPERATION_DENIED')
  }
  if (url.hostname.toLowerCase() !== host.toLowerCase() || url.host !== url.hostname || url.username || url.password)
    throw new CloudError('OPERATION_DENIED')
  return { name, host, port, protocol }
}

export function cloudConnectionURL({ protocol, host, port }: CloudConnectionDraft): string {
  const path = protocol === 'ws' || protocol === 'wss' ? '/mqtt' : ''
  return `${protocol}://${host}:${port}${path}`
}
