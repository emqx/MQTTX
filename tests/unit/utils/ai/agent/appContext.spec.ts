import { expect } from 'chai'
import { renderAppContext } from '@/utils/ai/agent/tools/appContext'

describe('agent app context', () => {
  it('should keep a connection name on one line', () => {
    const name = 'My "broker"\nsecond line'
    const text = renderAppContext({
      page: '/recent_connections/c1',
      currentConnection: { id: 'c1', name, connected: true },
      appliedScript: null,
      permissionMode: 'ask',
    })

    const lines = text.split('\n')
    expect(lines.filter((item) => item.includes('second line'))).to.have.length(1)
  })
})
