import { expect } from 'chai'
import { provisionZeroEmqx, ZeroEmqxFetch } from '@/utils/ai/agent/zeroEmqx'

interface FakeResponseInit {
  status: number
  body?: unknown
  statusText?: string
  invalidJson?: boolean
}

const fakeResponse = ({ status, body, statusText = '', invalidJson }: FakeResponseInit): Response =>
  ({
    status,
    statusText,
    json: async () => {
      if (invalidJson) throw new Error('not json')
      return body
    },
  } as unknown as Response)

const instanceBody = (overrides: Record<string, unknown> = {}) => ({
  instance_id: 'emqx-3a7f9c2b1d4e5678',
  mqtts: { host: 'mqtt.example.com', port: 8883, uri: 'mqtts://mqtt.example.com:8883' },
  wss: { host: 'mqtt.example.com', port: 8084, uri: 'wss://mqtt.example.com:8084/mqtt' },
  credentials: { username: 'emqx-3a7f9c2b1d4e5678', password: 'opaque-secret' },
  lifecycle: 'fixed_ttl',
  expires_at: '2026-05-02T03:24:11Z',
  idle_ttl_seconds: null,
  ...overrides,
})

const captureFetch = (
  response: Response,
): { fetchImpl: ZeroEmqxFetch; calls: { url: string; init?: RequestInit }[] } => {
  const calls: { url: string; init?: RequestInit }[] = []
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      return response
    },
  }
}

const provisionError = async (fetchImpl: ZeroEmqxFetch): Promise<Error> => {
  try {
    await provisionZeroEmqx(fetchImpl)
  } catch (caught) {
    return caught as Error
  }
  throw new Error('provisionZeroEmqx should have thrown')
}

describe('provisionZeroEmqx', () => {
  it('should request one tagged instance and parse a fixed_ttl broker', async () => {
    const { fetchImpl, calls } = captureFetch(fakeResponse({ status: 201, body: instanceBody() }))

    const instance = await provisionZeroEmqx(fetchImpl)

    expect(calls).to.have.length(1)
    expect(calls[0].url).to.equal('https://zero.emqx.io/v1/instances')
    expect(calls[0].init?.method).to.equal('POST')
    expect(calls[0].init?.headers).to.deep.equal({ 'content-type': 'application/json' })
    expect(JSON.parse(calls[0].init?.body as string)).to.deep.equal({ tag: 'mqttx' })
    expect(calls[0].init?.signal).to.be.instanceOf(AbortSignal)
    expect(instance).to.deep.equal({
      instanceId: 'emqx-3a7f9c2b1d4e5678',
      host: 'mqtt.example.com',
      port: 8883,
      username: 'emqx-3a7f9c2b1d4e5678',
      password: 'opaque-secret',
      lifecycle: 'fixed_ttl',
      expiresAt: '2026-05-02T03:24:11Z',
      idleTtlSeconds: null,
    })
  })

  it('should parse an idle_ttl broker without an expiry date', async () => {
    const body = instanceBody({ lifecycle: 'idle_ttl', expires_at: null, idle_ttl_seconds: 3600 })
    const { fetchImpl } = captureFetch(fakeResponse({ status: 201, body }))

    const instance = await provisionZeroEmqx(fetchImpl)

    expect(instance).to.include({ lifecycle: 'idle_ttl', expiresAt: null, idleTtlSeconds: 3600 })
  })

  it('should report the status and the error body of a rejected request', async () => {
    const body = { error: 'bad_request', message: 'tag must be DNS friendly' }
    const { fetchImpl } = captureFetch(fakeResponse({ status: 400, body, statusText: 'Bad Request' }))

    const error = await provisionError(fetchImpl)

    expect(error.message).to.contain('400')
    expect(error.message).to.contain('bad_request')
    expect(error.message).to.contain('tag must be DNS friendly')
    expect(error.message).to.not.contain('rate limiting')
  })

  it('should tell the model to wait when the network is rate limited', async () => {
    const body = { error: 'too_many_requests', message: 'slow down' }
    const { fetchImpl } = captureFetch(fakeResponse({ status: 429, body, statusText: 'Too Many Requests' }))

    const error = await provisionError(fetchImpl)

    expect(error.message).to.contain('429')
    expect(error.message).to.contain('slow down')
    expect(error.message).to.contain('rate limiting this network')
    expect(error.message).to.contain('wait a minute')
  })

  it('should reject a response that misses the credentials', async () => {
    const body = instanceBody({ credentials: { username: 'u' } })
    const { fetchImpl } = captureFetch(fakeResponse({ status: 201, body }))

    const error = await provisionError(fetchImpl)

    expect(error.message).to.contain('"password"')
  })

  it('should reject a response with an unusable mqtts port', async () => {
    const body = instanceBody({ mqtts: { host: 'mqtt.example.com', port: '8883' } })
    const { fetchImpl } = captureFetch(fakeResponse({ status: 201, body }))

    const error = await provisionError(fetchImpl)

    expect(error.message).to.contain('mqtts.port')
  })

  it('should reject a body that is not JSON', async () => {
    const { fetchImpl } = captureFetch(fakeResponse({ status: 201, invalidJson: true }))

    const error = await provisionError(fetchImpl)

    expect(error.message).to.contain('not valid JSON')
  })
})
