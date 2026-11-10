import { expect } from 'chai'
import { ipcRenderer } from 'electron'
import { loadMCPTools } from '@/utils/ai/mcp/MCPUtils'
import type { EnabledMCPServer } from '@/types/mcp'

const originalInvoke = ipcRenderer.invoke
const originalWarn = console.warn

const stubListTools = (servers: EnabledMCPServer[]) => {
  ipcRenderer.invoke = (async () => servers) as typeof ipcRenderer.invoke
}

const tool = (name: string): EnabledMCPServer['tools'][number] => ({
  name,
  description: '',
  input_schema: { type: 'object', properties: {} },
})

describe('loadMCPTools', () => {
  let warnings: unknown[][]

  beforeEach(() => {
    warnings = []
    console.warn = (...args: unknown[]) => {
      warnings.push(args)
    }
  })

  afterEach(() => {
    ipcRenderer.invoke = originalInvoke
    console.warn = originalWarn
  })

  it('keeps the first tool when provider-safe names collide', async () => {
    stubListTools([
      { name: 'a', tools: [tool('b__c')] },
      { name: 'a__b', tools: [tool('c')] },
    ])

    const tools = await loadMCPTools()

    expect(Object.keys(tools)).to.deep.equal(['a__b__c'])
    expect(tools['a__b__c'].title).to.equal('a - b__c')
    expect(warnings).to.have.length(1)
    expect(String(warnings[0][0])).to.contain('a__b').and.to.contain('"c"').and.to.contain('a__b__c')
  })

  it('loads non-colliding tools from every server', async () => {
    stubListTools([
      { name: 'alpha', tools: [tool('one')] },
      { name: 'beta', tools: [tool('two')] },
    ])

    const tools = await loadMCPTools()

    expect(Object.keys(tools)).to.have.members(['alpha__one', 'beta__two'])
    expect(tools['alpha__one'].title).to.equal('alpha - one')
    expect(tools['beta__two'].title).to.equal('beta - two')
    expect(warnings).to.have.length(0)
  })
})
