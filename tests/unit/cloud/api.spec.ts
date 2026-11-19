import { assert } from 'chai'
import { cloudGet } from '../../../src/main/cloud/api'
import { expectRejection } from './assertions'

describe('Cloud API transport', () => {
  const originalFetch = globalThis.fetch
  let generation = 1
  let rejected = false
  const auth = {
    credential: () => ({ value: 'test-token', expiresAt: Date.now() + 10000, generation }),
    validate: (current: number) => generation === current,
    reject: () => {
      rejected = true
      return { status: 'expired' as const, email: null, expiresAt: null, message: null }
    },
  }
  const get = () =>
    cloudGet('https://api.example.com', '/public_api/v1/mqttx/deployments?page=2', auth, new AbortController().signal)
  afterEach(() => {
    globalThis.fetch = originalFetch
    rejected = false
  })
  it('authenticates the GET on the host and returns JSON', async () => {
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://api.example.com/public_api/v1/mqttx/deployments?page=2')
      assert.deepEqual(options?.headers, { Authorization: 'Bearer test-token' })
      assert.strictEqual(options?.redirect, 'error')
      assert.strictEqual(options?.credentials, 'omit')
      return Response.json([{ deploymentID: 'example' }])
    }
    assert.deepEqual(await get(), [{ deploymentID: 'example' }])
  })
  it('rejects only the session that issued the request', async () => {
    for (const status of [200, 401]) {
      globalThis.fetch = async () => {
        generation++
        return Response.json([], { status })
      }
      await expectRejection(get(), { code: 'SESSION_CHANGED' })
      assert.isFalse(rejected)
    }
    globalThis.fetch = async () => new Response(null, { status: 401 })
    await expectRejection(get(), { code: 'AUTH_REJECTED' })
    assert.isTrue(rejected)
  })
  it('limits response bytes and passes through rate-limit timing', async () => {
    globalThis.fetch = async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1))
    await expectRejection(get(), { code: 'RESPONSE_TOO_LARGE' })
    globalThis.fetch = async () => new Response(null, { status: 429, headers: { 'retry-after': '12' } })
    await expectRejection(get(), { code: 'RATE_LIMITED_RETRY', params: { seconds: 12 } })
  })
})
