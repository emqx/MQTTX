const ZERO_EMQX_ENDPOINT = 'https://zero.emqx.io/v1/instances'
const TIMEOUT_MS = 15000

export type ZeroEmqxFetch = (input: string, init?: RequestInit) => Promise<Response>

export interface ZeroEmqxInstance {
  instanceId: string
  host: string
  port: number
  username: string
  password: string
  lifecycle: 'fixed_ttl' | 'idle_ttl'
  /** Only set for fixed_ttl instances */
  expiresAt: string | null
  /** Only set for idle_ttl instances */
  idleTtlSeconds: number | null
}

const asObject = (value: unknown, field: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Zero EMQX returned an unexpected response: "${field}" is not an object.`)
  }
  return value as Record<string, unknown>
}

const readString = (record: Record<string, unknown>, field: string): string => {
  const value = record[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Zero EMQX returned an unexpected response: "${field}" is missing or not a string.`)
  }
  return value
}

const readPort = (mqtts: Record<string, unknown>): number => {
  const port = mqtts.port
  if (typeof port !== 'number' || !Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Zero EMQX returned an unexpected response: "mqtts.port" is not a valid port.')
  }
  return port
}

const failure = async (response: Response): Promise<string> => {
  let detail = response.statusText
  try {
    const payload = (await response.json()) as { error?: unknown; message?: unknown }
    const parts = [payload.error, payload.message].filter((part): part is string => typeof part === 'string' && !!part)
    if (parts.length) detail = parts.join(': ')
  } catch {
    // The error body is optional; the status alone is enough to explain the failure
  }
  const limited =
    response.status === 429 ? ' Zero EMQX is rate limiting this network; wait a minute and try again, do not loop.' : ''
  return `Zero EMQX could not create a test broker (HTTP ${response.status}): ${
    detail || 'no details returned'
  }.${limited}`
}

const parse = (payload: unknown): ZeroEmqxInstance => {
  const root = asObject(payload, 'root')
  const mqtts = asObject(root.mqtts, 'mqtts')
  const credentials = asObject(root.credentials, 'credentials')
  const lifecycle = root.lifecycle
  if (lifecycle !== 'fixed_ttl' && lifecycle !== 'idle_ttl') {
    throw new Error('Zero EMQX returned an unexpected response: "lifecycle" is missing or not supported.')
  }
  return {
    instanceId: readString(root, 'instance_id'),
    host: readString(mqtts, 'host'),
    port: readPort(mqtts),
    username: readString(credentials, 'username'),
    password: readString(credentials, 'password'),
    lifecycle,
    expiresAt: typeof root.expires_at === 'string' && root.expires_at ? root.expires_at : null,
    idleTtlSeconds: typeof root.idle_ttl_seconds === 'number' ? root.idle_ttl_seconds : null,
  }
}

/**
 * Creates one free, temporary Zero EMQX instance over its public API. The credentials are only
 * returned once, so the caller must store them; a 201 is the only accepted answer and nothing is retried.
 */
export const provisionZeroEmqx = async (
  fetchImpl: ZeroEmqxFetch = (input, init) => fetch(input, init),
): Promise<ZeroEmqxInstance> => {
  const response = await fetchImpl(ZERO_EMQX_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tag: 'mqttx' }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (response.status !== 201) throw new Error(await failure(response))
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('Zero EMQX returned an unexpected response: the body is not valid JSON.')
  }
  return parse(payload)
}
