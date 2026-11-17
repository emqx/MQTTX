import { assert } from 'chai'
import http from 'http'
import type { AddressInfo } from 'net'
import { createHash } from 'crypto'
import version from '../../../src/version'
import { CloudAuth } from '../../../src/main/cloud/auth'
import { CloudDeviceIdentity } from '../../../src/main/cloud/device'
import { CloudError } from '../../../src/utils/cloudErrors'
import { cloudCallbackText } from '../../../src/utils/cloudI18n'

function displayToken(claims: unknown): string {
  return `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString(
    'base64url',
  )}.signature`
}

describe('Cloud authorization contract', function () {
  // Real HTTP callbacks and fetch aborts can exceed Mocha's default timeout on CI.
  this.timeout(10000)
  it('sends a stable device UUID to authorize and exchanges the code with the MQTTX callback and User-Agent', async () => {
    let tokenRequest: { url?: string; method?: string; headers: http.IncomingHttpHeaders; body: string } | undefined
    const server = http.createServer(async (request, response) => {
      let body = ''
      for await (const chunk of request) body += chunk.toString()
      tokenRequest = { url: request.url, method: request.method, headers: request.headers, body }
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(
        JSON.stringify({
          access_token: displayToken({ email: 'reader@example.com' }),
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'deployments:read',
        }),
      )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const identity = new CloudDeviceIdentity(
      async () => '550e8400e29b41d4a716446655440000',
      () => ({
        getPassword: async () => null,
        setPassword: async () => {
          throw new Error('Unexpected fallback')
        },
      }),
    )
    let authorization: URL | undefined
    let callbackResponse: Promise<Response> | undefined
    let oldPathStatus: number | undefined
    const auth = new CloudAuth({
      authURL: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      getDeviceId: () => identity.get(),
      vault: { load: () => null, save() {}, clear() {} },
      async openExternal(value) {
        authorization = new URL(value)
        const callback = new URL(authorization.searchParams.get('redirect_uri')!)
        assert.strictEqual(callback.pathname, '/mqttx/callback')
        callback.search = new URLSearchParams({
          state: authorization.searchParams.get('state')!,
          code: 'test-code',
        }).toString()
        const oldCallback = new URL(callback)
        oldCallback.pathname = '/oauth/callback'
        const oldResponse = await fetch(oldCallback)
        oldPathStatus = oldResponse.status
        await oldResponse.text()
        callbackResponse = fetch(callback)
        await callbackResponse
      },
    })
    try {
      const state = await auth.login()
      assert.strictEqual(state.status, 'signed-in')
      assert.strictEqual(state.email, 'reader@example.com')
      assert.notInclude(JSON.stringify(state), 'signature')
      assert.strictEqual(authorization!.searchParams.get('device_id'), await identity.get())
      assert.notInclude(authorization!.href, '550e8400e29b41d4a716446655440000')
      assert.strictEqual(oldPathStatus, 404)
      const response = await callbackResponse!
      assert.strictEqual(response.status, 200)
      await response.text()
      assert.strictEqual(tokenRequest!.url, '/api/v2/oauth/token')
      assert.strictEqual(tokenRequest!.method, 'POST')
      assert.strictEqual(tokenRequest!.headers['content-type'], 'application/x-www-form-urlencoded')
      assert.strictEqual(tokenRequest!.headers['user-agent'], `MQTTX/${version} (${process.platform}; ${process.arch})`)
      const form = new URLSearchParams(tokenRequest!.body)
      assert.strictEqual(form.get('redirect_uri'), authorization!.searchParams.get('redirect_uri'))
      assert.strictEqual(form.get('code'), 'test-code')
      assert.isFalse(form.has('device_id'))
      assert.strictEqual(
        createHash('sha256').update(form.get('code_verifier')!).digest('base64url'),
        authorization!.searchParams.get('code_challenge'),
      )
    } finally {
      auth.dispose()
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })

  it('restores the display email and clears it on logout, expiry or token rejection', () => {
    for (const action of ['logout', 'expiry', 'rejection']) {
      let now = Date.now()
      const auth = new CloudAuth({
        authURL: 'https://auth.example.com',
        now: () => now,
        vault: {
          load: () => ({ value: displayToken({ email: 'reader@example.com' }), expiresAt: now + 60000 }),
          save() {},
          clear() {},
        },
        getDeviceId: async () => 'unused',
        openExternal: async () => {},
      })
      try {
        assert.strictEqual(auth.state().email, 'reader@example.com')
        if (action === 'logout') auth.invalidate()
        else if (action === 'expiry') now += 60001
        else auth.reject(auth.generation)
        assert.isNull(auth.state().email)
        assert.notStrictEqual(auth.state().status, 'signed-in')
      } finally {
        auth.dispose()
      }
    }
  })

  for (const [outcome, code] of [
    ['success', 'AUTH_COMPLETE'],
    ['exchange-failure', 'AUTH_RESULT_INVALID'],
    ['invalid-json', 'OPERATION_FAILED'],
    ['storage-json-failure', 'OPERATION_FAILED'],
    ['storage-failure', 'STORAGE_UNAVAILABLE'],
    ['cancel', 'AUTH_CANCELLED'],
    ['timeout', 'AUTH_TIMEOUT'],
  ]) {
    it(`finishes the browser callback with the actual login result after ${outcome}`, async () => {
      let releaseToken!: () => void
      const tokenGate = new Promise<void>((resolve) => {
        releaseToken = resolve
      })
      let exchanging!: () => void
      const tokenRequested = new Promise<void>((resolve) => {
        exchanging = resolve
      })
      const server = http.createServer(async (_request, response) => {
        exchanging()
        await tokenGate
        if (outcome === 'invalid-json') {
          response.writeHead(502, { 'Content-Type': 'text/html' })
          response.end('<html>synthetic-private-response</html>')
          return
        }
        response.writeHead(outcome === 'exchange-failure' ? 400 : 200, { 'Content-Type': 'application/json' })
        response.end(
          JSON.stringify({ access_token: 'token', token_type: 'Bearer', expires_in: 3600, scope: 'deployments:read' }),
        )
      })
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      let callbackResponse!: Promise<Response>
      let responseReceived = false
      let saved = false
      const auth = new CloudAuth({
        authURL: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        timeout: outcome === 'timeout' ? 300 : 2000,
        getDeviceId: async () => 'device-id',
        vault: {
          load: () => null,
          save() {
            assert.isFalse(responseReceived)
            if (outcome === 'storage-failure') throw new CloudError('STORAGE_UNAVAILABLE')
            if (outcome === 'storage-json-failure') throw new SyntaxError('synthetic-private-session')
            saved = true
          },
          clear() {},
        },
        async openExternal(value) {
          const authorization = new URL(value)
          const callback = new URL(authorization.searchParams.get('redirect_uri')!)
          callback.search = new URLSearchParams({
            state: authorization.searchParams.get('state')!,
            code: 'test-code',
          }).toString()
          callbackResponse = fetch(callback).then((response) => {
            responseReceived = true
            return response
          })
          await callbackResponse
        },
      })
      const originalLog = console.error
      const records: unknown[][] = []
      try {
        if (outcome === 'invalid-json' || outcome === 'storage-json-failure')
          console.error = (...values: unknown[]) => records.push(values)
        const login = auth.login('en')
        await tokenRequested
        await new Promise<void>((resolve) => setImmediate(resolve))
        assert.isFalse(responseReceived)
        if (outcome === 'cancel') auth.invalidate()
        if (outcome !== 'timeout') releaseToken()
        const state = await login
        const response = await callbackResponse
        assert.strictEqual(response.status, outcome === 'success' ? 200 : 500)
        assert.strictEqual(await response.text(), cloudCallbackText(code, 'en'))
        assert.strictEqual(state.status, outcome === 'success' ? 'signed-in' : 'signed-out')
        assert.strictEqual(saved, outcome === 'success')
        if (outcome === 'invalid-json' || outcome === 'storage-json-failure') {
          const diagnostic = JSON.stringify(records)
          assert.include(
            diagnostic,
            outcome === 'invalid-json'
              ? 'token response parsing (HTTP 502, JSON false)'
              : 'session storage (HTTP 200, JSON true)',
          )
          assert.include(diagnostic, 'SyntaxError')
          assert.notMatch(diagnostic, /synthetic-private-response|synthetic-private-session/)
        }
      } finally {
        console.error = originalLog
        auth.dispose()
        releaseToken()
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
      }
    })
  }

  it('keeps sessions usable when display metadata is absent or malformed', () => {
    for (const value of [
      'opaque-token',
      'header.invalid-json.signature',
      displayToken(null),
      displayToken({}),
      displayToken({ email: 123 }),
      displayToken({ email: '   ' }),
      displayToken({ email: 'a'.repeat(255) }),
    ]) {
      const auth = new CloudAuth({
        authURL: 'https://auth.example.com',
        vault: { load: () => ({ value, expiresAt: Date.now() + 60000 }), save() {}, clear() {} },
        getDeviceId: async () => 'unused',
        openExternal: async () => {},
      })
      try {
        assert.strictEqual(auth.state().status, 'signed-in')
        assert.isNull(auth.state().email)
        assert.strictEqual(auth.credential().value, value)
      } finally {
        auth.dispose()
      }
    }
  })

  for (const action of ['cancel', 'timeout', 'failure']) {
    it(`does not open a browser or accept a late identity after ${action} during device resolution`, async () => {
      let complete!: (deviceID: string) => void
      let started!: () => void
      const reading = new Promise<void>((resolve) => {
        started = resolve
      })
      let opened = false
      const auth = new CloudAuth({
        authURL: 'https://auth.example.com',
        vault: { load: () => null, save() {}, clear() {} },
        timeout: action === 'timeout' ? 20 : 1000,
        getDeviceId: () => {
          started()
          if (action === 'failure') return Promise.reject(new CloudError('DEVICE_ID_UNAVAILABLE'))
          return new Promise<string>((resolve) => {
            complete = resolve
          })
        },
        openExternal: async () => {
          opened = true
        },
      })
      try {
        const login = auth.login()
        await reading
        if (action === 'cancel') auth.invalidate()
        const state = await login
        assert.strictEqual(state.status, 'signed-out')
        if (action === 'timeout') assert.strictEqual(state.message!.code, 'AUTH_TIMEOUT')
        if (action === 'failure') assert.strictEqual(state.message!.code, 'DEVICE_ID_UNAVAILABLE')
        if (action !== 'failure') complete('550e8400-e29b-41d4-a716-446655440000')
        await new Promise<void>((resolve) => setImmediate(resolve))
        assert.isFalse(opened)
        assert.strictEqual(auth.state().status, 'signed-out')
      } finally {
        auth.dispose()
      }
    })
  }
})
