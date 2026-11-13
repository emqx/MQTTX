import { assert } from 'chai'
import { expectError, expectRejection } from './assertions'
import messages from '../../../src/lang/cloud'
import { cloudCallbackText, cloudErrorKey } from '../../../src/utils/cloudI18n'
import { CloudError, cloudError, cloudIssue } from '../../../src/utils/cloudErrors'
import { CloudAuth } from '../../../src/main/cloud/auth'
const languages = ['zh', 'en', 'ja', 'tr', 'hu', 'ko']
function checkTranslations(values: Record<string, any>) {
  for (const entry of Object.values(values)) {
    if (!entry.en) {
      checkTranslations(entry)
      continue
    }
    const params = (entry.en.match(/\{\w+\}/g) || []).sort()
    for (const language of languages) {
      assert.strictEqual(typeof entry[language], 'string')
      assert.isOk(entry[language].length)
      assert.deepEqual((entry[language].match(/\{\w+\}/g) || []).sort(), params)
    }
  }
}
describe('Cloud i18n', () => {
  it('host Cloud messages cover all supported languages and preserve interpolation parameters', () => {
    checkTranslations(messages)
    assert.strictEqual(cloudCallbackText('AUTH_COMPLETE', 'ja'), messages.errors.AUTH_COMPLETE.ja)
    assert.strictEqual(cloudCallbackText('AUTH_COMPLETE', 'unknown'), messages.errors.AUTH_COMPLETE.en)
    assert.strictEqual(cloudCallbackText('AUTH_COMPLETE', 'constructor'), messages.errors.AUTH_COMPLETE.en)
    assert.strictEqual(cloudErrorKey({ code: 'UNKNOWN', params: {} }), 'cloud.errors.OPERATION_FAILED')
  })
  it('error transport retains codes and parameters without leaking raw exception messages', () => {
    const issue = cloudIssue(new CloudError('DOWNLOAD_UNAVAILABLE', { status: 503 }))
    const restored = cloudError(JSON.parse(JSON.stringify(issue)))
    assert.strictEqual(restored.code, 'DOWNLOAD_UNAVAILABLE')
    assert.deepEqual(restored.params, { status: 503 })
    assert.deepEqual(cloudIssue(new Error('private exception details')), { code: 'OPERATION_FAILED', params: {} })
  })
  it('authorization callback uses the login language while the session keeps an error code', async () => {
    let callbackText: string | undefined
    const auth = new CloudAuth({
      getDeviceId: async () => '550e8400-e29b-41d4-a716-446655440000',
      authURL: 'http://127.0.0.1:43110',
      vault: { load: () => null, save() {}, clear() {} },
      async openExternal(value: string) {
        const authorize = new URL(value)
        const callback = new URL(authorize.searchParams.get('redirect_uri')!)
        callback.search = new URLSearchParams({
          state: authorize.searchParams.get('state')!,
          error: 'access_denied',
        }).toString()
        callbackText = await fetch(callback).then((r) => r.text())
      },
    })
    try {
      const state = await auth.login('ja')
      // openExternal reads the response asynchronously after the callback resolves login.
      for (let i = 0; callbackText === undefined && i < 100; i++) await new Promise((r) => setTimeout(r, 5))
      assert.strictEqual(callbackText, messages.errors.AUTH_CANCELLED.ja)
      assert.strictEqual(state.message!.code, 'AUTH_CANCELLED')
    } finally {
      auth.dispose()
    }
  })
})
