import { expect } from 'chai'
import { renderAppContext } from '@/utils/ai/agent/tools/appContext'

describe('agent app context', () => {
  it('should quote a connection name and keep a newline out of the line', () => {
    const name = 'My "broker"\nsecond line'
    const text = renderAppContext({
      page: '/recent_connections/c1',
      currentConnection: { id: 'c1', name, connected: true },
      appliedScript: null,
      permissionMode: 'ask',
    })

    const lines = text.split('\n')
    const line = lines.find((item) => item.startsWith('- Current connection:'))
    expect(line).to.equal(`- Current connection: ${JSON.stringify(name)} (id: c1, connected: true)`)
    expect(line).to.contain('\\n')
    expect(lines.filter((item) => item.includes('second line'))).to.have.length(1)
  })
})
