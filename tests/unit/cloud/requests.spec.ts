import { assert } from 'chai'
import { parseCloudRequest } from '../../../src/main/cloud/requests'
import { cloudDiagnostic, logCloudFailure } from '../../../src/main/cloud/diagnostics'
import { releaseVersion } from '../../../src/main/cloud/manifest'
import { expectError } from './assertions'

describe('Cloud contracts and diagnostics', () => {
  it('checks untrusted method names and frame parameters before dispatch', () => {
    assert.deepEqual(parseCloudRequest('status'), { method: 'status', args: {} })
    const args = { id: 'r-12345678-1234-1234-1234-123456789abc', method: 'deployments', params: { page: 1, limit: 20 } }
    assert.deepEqual(parseCloudRequest('backend', args), { method: 'backend', args })
    for (const [method, value] of [
      ['unknown', {}],
      ['ready', {}],
      ['ready', { id: '../outside' }],
      ['validate', { id: args.id, generation: '1' }],
      ['reject', { id: args.id, generation: NaN }],
      ['credential', {}],
      ['backend', { id: args.id, method: '../outside' }],
      ['backend', { id: args.id }],
      ['rpc', { id: args.id, method: 'deployments' }],
      ['status', []],
    ]) {
      expectError(() => parseCloudRequest(method, value), { code: 'OPERATION_DENIED' })
    }
  })
  it('rejects prerelease versions under the stable-release publication rule', () => {
    expectError(() => releaseVersion('1.0.0-beta.1'), { code: 'PACKAGE_INVALID' })
  })
  it('retains system failure details without logging credentials or arbitrary exception text', () => {
    const error = Object.assign(
      new Error('Bearer sensitive-token code_verifier=secret password=hidden https://example.com?token=secret'),
      {
        cause: Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' }),
      },
    )
    const diagnostic = cloudDiagnostic(error)
    assert.strictEqual(diagnostic.code, 'ECONNREFUSED')
    assert.isNotEmpty(diagnostic.frames)
    let record: unknown[] = []
    const original = console.error
    try {
      console.error = (...args: unknown[]) => {
        record = args
      }
      logCloudFailure('download', error)
    } finally {
      console.error = original
    }
    assert.notMatch(JSON.stringify(record), /sensitive-token|secret|password|example\.com/)
    assert.include(JSON.stringify(record), 'ECONNREFUSED')
    Object.assign(error, { cause: error })
    assert.strictEqual(cloudDiagnostic(error).name, 'Error')
  })
})
