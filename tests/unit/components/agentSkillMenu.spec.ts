import { expect } from 'chai'
import AgentComposer from '@/components/agent/AgentComposer.vue'
import { AGENT_SKILLS } from '@/utils/ai/agent/skills'

const methods = (AgentComposer as any).options.methods

const keyEvent = (key: string): KeyboardEvent =>
  ({ key, preventDefault: () => undefined, stopPropagation: () => undefined } as unknown as KeyboardEvent)

const context = (overrides: Record<string, unknown> = {}): any => ({
  message: '/',
  skillMenuOpen: true,
  skillMenuIndex: 0,
  skillMenuQuery: '',
  filteredSkills: AGENT_SKILLS,
  selectedSkill: null,
  composing: false,
  $nextTick: (callback: () => void) => callback(),
  focus: () => undefined,
  handleInput: () => undefined,
  closeSkillMenu: methods.closeSkillMenu,
  closeMenus: methods.closeMenus,
  moveSkillSelection: methods.moveSkillSelection,
  confirmSkillSelection: methods.confirmSkillSelection,
  applySkill: methods.applySkill,
  ...overrides,
})

describe('Agent skill menu', () => {
  it('should move the selection down and up and wrap around', () => {
    const ctx = context()

    methods.moveSkillSelection.call(ctx, 1)
    expect(ctx.skillMenuIndex).to.equal(1)

    methods.moveSkillSelection.call(ctx, -1)
    expect(ctx.skillMenuIndex).to.equal(0)

    methods.moveSkillSelection.call(ctx, -1)
    expect(ctx.skillMenuIndex).to.equal(AGENT_SKILLS.length - 1)
  })

  it('should select the highlighted skill with Enter', () => {
    const ctx = context({ skillMenuIndex: 2 })

    methods.onKeydown.call(ctx, keyEvent('Enter'))

    expect(ctx.selectedSkill).to.deep.equal({ skill: AGENT_SKILLS[2].name })
    expect(ctx.skillMenuOpen).to.equal(false)
  })

  it('should select the highlighted skill with Tab', () => {
    const ctx = context({ skillMenuIndex: 1 })

    methods.onKeydown.call(ctx, keyEvent('Tab'))

    expect(ctx.selectedSkill).to.deep.equal({ skill: AGENT_SKILLS[1].name })
    expect(ctx.skillMenuOpen).to.equal(false)
  })

  it('should close on Escape from the composer', () => {
    const ctx = context()

    methods.onKeydown.call(ctx, keyEvent('Escape'))
    expect(ctx.skillMenuOpen).to.equal(false)
  })

  it('should open while the input starts with a slash and filter with the rest', () => {
    const ctx = context({ message: '/pay', skillMenuOpen: false, skillMenuIndex: 3 })

    methods.updateSkillMenu.call(ctx)

    expect(ctx.skillMenuOpen).to.equal(true)
    expect(ctx.skillMenuQuery).to.equal('pay')
    expect(ctx.skillMenuIndex).to.equal(0)
  })

  it('should close when the slash is deleted', () => {
    const ctx = context({ message: 'hello' })

    methods.updateSkillMenu.call(ctx)

    expect(ctx.skillMenuOpen).to.equal(false)
  })

  it('should close every menu on a click outside', () => {
    const ctx = {
      showModeMenu: true,
      showModelMenu: true,
      skillMenuOpen: true,
      mentionMenuOpen: true,
      mentionQuery: { start: 0, end: 1, query: 'a' },
      closeMentionMenu: methods.closeMentionMenu,
    }

    methods.closeMenus.call(ctx)

    expect(ctx).to.deep.equal({
      showModeMenu: false,
      showModelMenu: false,
      skillMenuOpen: false,
      mentionMenuOpen: false,
      mentionQuery: null,
      closeMentionMenu: methods.closeMentionMenu,
    })
  })

  it('should close every menu on Escape handled by the composer wrap', () => {
    const ctx = {
      showModeMenu: true,
      showModelMenu: false,
      skillMenuOpen: true,
      mentionMenuOpen: false,
      mentionQuery: null,
      closeMenus: methods.closeMenus,
      closeMentionMenu: methods.closeMentionMenu,
    }
    let stopped = false

    methods.onEsc.call(ctx, { stopPropagation: () => (stopped = true) } as unknown as KeyboardEvent)

    expect(ctx).to.deep.equal({
      showModeMenu: false,
      showModelMenu: false,
      skillMenuOpen: false,
      mentionMenuOpen: false,
      mentionQuery: null,
      closeMenus: methods.closeMenus,
      closeMentionMenu: methods.closeMentionMenu,
    })
    expect(stopped).to.equal(true)
  })

  it('should close only the mention menu on Escape when it is the only one open', () => {
    const ctx = {
      showModeMenu: false,
      showModelMenu: false,
      skillMenuOpen: false,
      mentionMenuOpen: true,
      closeMenus: methods.closeMenus,
      closeMentionMenu: methods.closeMentionMenu,
    }
    let stopped = false

    methods.onEsc.call(ctx, { stopPropagation: () => (stopped = true) } as unknown as KeyboardEvent)

    expect(ctx.mentionMenuOpen).to.equal(false)
    expect(stopped).to.equal(true)
  })
})
