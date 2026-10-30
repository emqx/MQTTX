import { expect } from 'chai'
import { ipcRenderer } from 'electron'
import { loadMCPTools } from '@/utils/ai/mcp/MCPUtils'

interface ServerTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

interface ServerWithTools {
  name: string
  tools: ServerTool[]
}

const originalInvoke = ipcRenderer.invoke
const originalWarn = console.warn

const stubListTools = (servers: ServerWithTools[]) => {
  ipcRenderer.invoke = (async (channel: string) => {
    if (channel === 'mcp:list-tools') {
      return servers
    }
    return {}
  }) as typeof ipcRenderer.invoke
}

const tool = (name: string, description: string): ServerTool => ({
  name,
  description,
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
      { name: 'a', tools: [tool('b__c', 'first')] },
      { name: 'a__b', tools: [tool('c', 'second')] },
    ])

    const tools = await loadMCPTools()

    expect(Object.keys(tools)).to.deep.equal(['a__b__c'])
    expect(tools['a__b__c'].title).to.equal('a - b__c')
    expect(warnings).to.have.length(1)
    expect(String(warnings[0][0])).to.contain('a__b').and.to.contain('"c"').and.to.contain('a__b__c')
  })

  it('loads non-colliding tools from every server', async () => {
    stubListTools([
      { name: 'alpha', tools: [tool('one', 'first')] },
      { name: 'beta', tools: [tool('two', 'second')] },
    ])

    const tools = await loadMCPTools()

    expect(Object.keys(tools)).to.have.members(['alpha__one', 'beta__two'])
    expect(tools['alpha__one'].title).to.equal('alpha - one')
    expect(tools['beta__two'].title).to.equal('beta - two')
    expect(warnings).to.have.length(0)
  })
})
