import { expect } from 'chai'
import { getMCPContentText } from '@/utils/ai/mcp/MCPUtils'
import { TEXT_MODEL_BYTES } from '@/utils/ai/agent/attachments'

describe('MCP utils', () => {
  it('should cap a large result and mark it as truncated', () => {
    const text = 'x'.repeat(TEXT_MODEL_BYTES + 1234)
    const result = getMCPContentText([{ type: 'text', text }] as any)

    expect(result.startsWith('x'.repeat(TEXT_MODEL_BYTES))).to.equal(true)
    expect(result.endsWith('\n[truncated]')).to.equal(true)
  })
})
