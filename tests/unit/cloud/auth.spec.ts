import { assert } from 'chai'
import http from 'http'
import type { AddressInfo } from 'net'
import { createHash } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import version from '../../../src/version'
import { CloudAuth } from '../../../src/main/cloud/auth'
import { CloudDeviceIdentity } from '../../../src/main/cloud/device'
import { CloudError } from '../../../src/utils/cloudErrors'

describe('Cloud authorization contract', () => {
  it('sends a stable device UUID to authorize and exchanges the code with the MQTTX callback and User-Agent', async () => {
    let tokenRequest: { url?: string; method?: string; headers: http.IncomingHttpHeaders; body: string } | undefined
    const server = http.createServer(async (request, response) => {
      let body = ''
      for await (const chunk of request) body += chunk.toString()
      tokenRequest = { url: request.url, method: request.method, headers: request.headers, body }
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(
        JSON.stringify({
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'deployments:read',
        }),
      )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-auth-device-'))
    const identity = new CloudDeviceIdentity(
      path.join(root, 'device.json'),
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
      fs.rmSync(root, { recursive: true, force: true })
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
