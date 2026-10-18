import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { compile, parseComponent } from 'vue-template-compiler'
import AgentComposer from '@/components/agent/AgentComposer.vue'

// Event names the panel listens for on <agent-composer>; Vue 2 matches event names exactly
const panelComposerEvents = (): string[] => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/agent/AgentPanel.vue'), 'utf8')
  const { ast } = compile(parseComponent(source).template!.content)
  const find = (node: any): any =>
    node?.tag === 'agent-composer' ? node : (node?.children ?? []).map(find).find(Boolean)
  return Object.keys(find(ast)?.events ?? {})
}

describe('Agent permission menu', () => {
  it('should send the chosen mode under an event name the panel listens for', () => {
    const emitted: string[] = []
    const composer = { $emit: (name: string, mode: string) => mode === 'auto' && emitted.push(name) }

    ;(AgentComposer as any).options.methods.chooseMode.call(composer, 'auto')

    expect(emitted).to.have.length(1)
    expect(panelComposerEvents()).to.include(emitted[0])
  })
})
