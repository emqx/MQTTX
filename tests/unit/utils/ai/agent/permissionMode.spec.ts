import { expect } from 'chai'
import { resolveInitialPermissionMode } from '@/utils/ai/agent/permissionMode'

describe('resolveInitialPermissionMode', () => {
  it('should prefer the mode picked in this session', () => {
    expect(resolveInitialPermissionMode('auto', 'ask')).to.equal('auto')
    expect(resolveInitialPermissionMode('ask', 'auto')).to.equal('ask')
  })

  it('should fall back to the settings default without a session value', () => {
    expect(resolveInitialPermissionMode(null, 'auto')).to.equal('auto')
    expect(resolveInitialPermissionMode(undefined, 'ask')).to.equal('ask')
  })

  it('should fall back to ask when neither value is valid', () => {
    expect(resolveInitialPermissionMode(null, null)).to.equal('ask')
    expect(resolveInitialPermissionMode(undefined, undefined)).to.equal('ask')
    expect(resolveInitialPermissionMode('nonsense', 'nonsense')).to.equal('ask')
    expect(resolveInitialPermissionMode('', '')).to.equal('ask')
  })
})
