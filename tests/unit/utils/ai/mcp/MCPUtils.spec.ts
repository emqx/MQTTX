import { expect } from 'chai'
import { getMCPContentText, MCP_TEXT_LIMIT } from '@/utils/ai/mcp/MCPUtils'

describe('MCP utils', () => {
  it('should join every text block', () => {
    const result = getMCPContentText([
      { type: 'text', text: 'first' },
      { type: 'text', text: 'second' },
    ] as any)

    expect(result).to.equal('first\nsecond')
  })

  it('should cap a large result and say how much was cut', () => {
    const text = 'x'.repeat(MCP_TEXT_LIMIT + 1234)
    const result = getMCPContentText([{ type: 'text', text }] as any)

    expect(result).to.have.length(MCP_TEXT_LIMIT + '\n[truncated 1234 characters]'.length)
    expect(result.startsWith('x'.repeat(MCP_TEXT_LIMIT))).to.equal(true)
    expect(result.endsWith('\n[truncated 1234 characters]')).to.equal(true)
  })
})
