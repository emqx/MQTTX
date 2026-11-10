import { expect } from 'chai'
import { isAllowedExternalUrl } from '@/main/externalUrl'

describe('isAllowedExternalUrl', () => {
  it('allows http and https URLs on the project domains', () => {
    expect(isAllowedExternalUrl('https://github.com/emqx/MQTTX')).to.equal(true)
    expect(isAllowedExternalUrl('https://docs.emqx.com/x')).to.equal(true)
    expect(isAllowedExternalUrl('http://mqttx.app')).to.equal(true)
  })

  it('rejects other schemes, lookalike hosts and invalid URLs', () => {
    expect(isAllowedExternalUrl('smb://github.com/x')).to.equal(false)
    expect(isAllowedExternalUrl('vscode://github.com/x')).to.equal(false)
    expect(isAllowedExternalUrl('file:///etc/passwd')).to.equal(false)
    expect(isAllowedExternalUrl('javascript:alert(1)')).to.equal(false)
    expect(isAllowedExternalUrl('https://github.com.evil.com')).to.equal(false)
    expect(isAllowedExternalUrl('https://github.com@evil.com')).to.equal(false)
    expect(isAllowedExternalUrl('not a url')).to.equal(false)
  })
})
