import { expect } from 'chai'
import AgentMessages from '@/components/agent/AgentMessages.vue'
import { AgentMessage } from '@/types/agent'

// The .vue shim types the default export as a plain Vue constructor, so the static helper needs a cast
const buildBlocks = (AgentMessages as any).buildBlocks as (message: AgentMessage, streaming?: boolean) => any[]

describe('AgentMessages.buildBlocks', () => {
  it('should keep each step thinking as its own block, in order', () => {
    const message: AgentMessage = {
      id: '1',
      role: 'assistant',
      content: 'Done',
      parts: [
        { type: 'reasoning', text: 'First', startedAt: 1, finishedAt: 2 },
        { type: 'tool', toolCallId: 'c1', toolName: 'get_connection', input: {}, state: 'done', output: {} },
        { type: 'reasoning', text: 'Second', startedAt: 3, finishedAt: 4 },
        { type: 'text', text: 'Done' },
      ],
    }

    const blocks = buildBlocks(message)

    expect(blocks.map((block: any) => block.kind)).to.deep.equal(['reasoning', 'steps', 'reasoning', 'text'])
    expect(blocks[0].part.text).to.equal('First')
    expect(blocks[2].part.text).to.equal('Second')
    expect(blocks[0].streaming).to.equal(false)
  })

  it('should mark only the unfinished thinking of a streaming reply as streaming', () => {
    const message: AgentMessage = {
      id: '1',
      role: 'assistant',
      content: '',
      parts: [
        { type: 'reasoning', text: 'Done thinking', startedAt: 1, finishedAt: 2 },
        { type: 'reasoning', text: 'Still thinking', startedAt: 3 },
      ],
    }

    const blocks = buildBlocks(message, true)

    expect(blocks[0].streaming).to.equal(false)
    expect(blocks[1].streaming).to.equal(true)
  })

  it('should render a legacy reasoning string as one leading block', () => {
    const blocks = buildBlocks({ id: '1', role: 'assistant', content: 'Hi', reasoning: 'Old thinking' })

    expect(blocks).to.have.length(1)
    expect(blocks[0].kind).to.equal('reasoning')
    expect(blocks[0].part.text).to.equal('Old thinking')
    expect(blocks[0].streaming).to.equal(false)
  })

  it('should ignore the legacy string once the message has reasoning parts', () => {
    const blocks = buildBlocks({
      id: '1',
      role: 'assistant',
      content: '',
      reasoning: 'Old thinking',
      parts: [{ type: 'reasoning', text: 'New thinking', startedAt: 1, finishedAt: 2 }],
    })

    expect(blocks.map((block: any) => block.kind)).to.deep.equal(['reasoning'])
    expect(blocks[0].part.text).to.equal('New thinking')
  })

  it('should add a file block after a finished save_files step', () => {
    const message: AgentMessage = {
      id: '1',
      role: 'assistant',
      content: 'Saved',
      parts: [
        {
          type: 'tool',
          toolCallId: 'c1',
          toolName: 'save_files',
          input: { name: 'proj', files: [{ path: 'src/main.py', size: 8 }] },
          state: 'done',
          output: { relativePath: 'conv/abc-proj.zip', size: 120, fileCount: 1 },
        },
        { type: 'text', text: 'Saved' },
      ],
    }

    const blocks = buildBlocks(message)

    expect(blocks.map((block: any) => block.kind)).to.deep.equal(['steps', 'file', 'text'])
    expect(blocks[1].part.toolName).to.equal('save_files')
  })

  it('should not add a file block when save_files failed', () => {
    const message: AgentMessage = {
      id: '1',
      role: 'assistant',
      content: '',
      parts: [
        {
          type: 'tool',
          toolCallId: 'c1',
          toolName: 'save_files',
          input: { name: 'proj' },
          state: 'error',
          error: 'boom',
        },
      ],
    }

    const blocks = buildBlocks(message)

    expect(blocks.map((block: any) => block.kind)).to.deep.equal(['steps'])
  })
})
