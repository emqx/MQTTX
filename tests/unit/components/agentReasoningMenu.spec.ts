import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { compile, parseComponent } from 'vue-template-compiler'
import AgentComposer from '@/components/agent/AgentComposer.vue'
import { AGENT_REASONING_LEVELS, DEFAULT_AGENT_REASONING } from '@/utils/ai/reasoning'

// Event names the panel listens for on <agent-composer>; Vue 2 matches event names exactly
const panelComposerEvents = (): string[] => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/agent/AgentPanel.vue'), 'utf8')
  const { ast } = compile(parseComponent(source).template!.content)
  const find = (node: any): any =>
    node?.tag === 'agent-composer' ? node : (node?.children ?? []).map(find).find(Boolean)
  return Object.keys(find(ast)?.events ?? {})
}

/** Computed properties of a class component are declared as `{ get, set }` */
const computed = (name: string, ctx: any) => (AgentComposer as any).options.computed[name].get.call(ctx)

describe('Agent reasoning menu', () => {
  it('should send the chosen strength under an event name the panel listens for', () => {
    const emitted: Array<{ name: string; level: string }> = []
    const composer = { $emit: (name: string, level: string) => emitted.push({ name, level }) }

    ;(AgentComposer as any).options.methods.chooseReasoning.call(composer, 'high')

    expect(emitted).to.have.length(1)
    expect(emitted[0].level).to.equal('high')
    expect(panelComposerEvents()).to.include(emitted[0].name)
  })

  it('should offer every level, starting with the provider default', () => {
    const levels = computed('reasoningLevels', {})

    expect(levels).to.deep.equal([...AGENT_REASONING_LEVELS])
    expect(levels[0]).to.equal(DEFAULT_AGENT_REASONING)
  })

  it('should hide the strength control for a model that cannot control it', () => {
    expect(computed('showReasoning', { model: 'gpt-5.2' })).to.equal(true)
    expect(computed('showReasoning', { model: 'gpt-4o' })).to.equal(false)
    expect(computed('showReasoning', { model: 'my-custom-model' })).to.equal(true)
  })

  it('should show the level next to the model name only when one is chosen', () => {
    expect(computed('showModelLevel', { model: 'gpt-5.2', agentReasoning: 'high' })).to.equal(true)
    expect(computed('showModelLevel', { model: 'gpt-4o', agentReasoning: 'high' })).to.equal(false)
    expect(computed('showModelLevel', { model: 'gpt-5.2', agentReasoning: DEFAULT_AGENT_REASONING })).to.equal(false)
  })

  it('should render the strength buttons inside the model menu and wire them to chooseReasoning', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/agent/AgentComposer.vue'), 'utf8')
    const { ast } = compile(parseComponent(source).template!.content)
    const attr = (node: any, name: string) =>
      (node?.attrs ?? []).find((entry: any) => entry.name === name)?.value as string | undefined
    const findGroup = (node: any): any => {
      if (attr(node, 'data-test') === '"reasoning-levels"') return node
      for (const child of node?.children ?? []) {
        const found = findGroup(child)
        if (found) return found
      }
      return undefined
    }

    const group = findGroup(ast)
    expect(group, 'reasoning level group').to.not.equal(undefined)

    // One button per level, rendered from the v-for over the offered levels
    const button = group.children.find((child: any) => child.tag === 'button')
    expect(attr(button, 'data-level')).to.equal('level')
    expect(attr(button, ':data-level') ?? attr(button, 'data-level')).to.equal('level')
    expect(button.events?.click?.value).to.include('chooseReasoning')
  })
})
