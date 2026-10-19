import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { compile, parseComponent } from 'vue-template-compiler'
import AgentComposer from '@/components/agent/AgentComposer.vue'
import { ConnectionMention } from '@/utils/ai/agent/mentions'

const methods = (AgentComposer as any).options.methods
const computed = (AgentComposer as any).options.computed

const keyEvent = (key: string): KeyboardEvent =>
  ({ key, preventDefault: () => undefined, stopPropagation: () => undefined } as unknown as KeyboardEvent)

const connections: ConnectionMention[] = [
  { id: 'c1', name: 'Alpha', host: 'a.example.com', port: 1883, connected: true },
  { id: 'c2', name: 'Beta', host: 'b.example.com', port: 8883, connected: false },
]

/** The composer is never mounted here: the methods run against plain state, like the Skill menu test */
const context = (overrides: Record<string, unknown> = {}): any => ({
  message: 'connect to @a',
  composing: false,
  selectedSkill: null,
  selectedConnections: [],
  attachments: [],
  disabled: false,
  connections,
  currentConnectionId: '',
  connectionName: '',
  skillMenuOpen: false,
  mentionMenuOpen: true,
  mentionMenuIndex: 0,
  mentionQuery: { start: 11, end: 13, query: 'a' },
  $refs: { textarea: { selectionStart: 13, value: 'connect to @a' } },
  $nextTick: (callback: () => void) => callback(),
  closeMentionMenu: methods.closeMentionMenu,
  closeSkillMenu: methods.closeSkillMenu,
  closeMenus: methods.closeMenus,
  moveMentionSelection: methods.moveMentionSelection,
  confirmMentionSelection: methods.confirmMentionSelection,
  applyConnection: methods.applyConnection,
  selectConnection: methods.selectConnection,
  removeConnection: methods.removeConnection,
  mentionCurrentConnection: methods.mentionCurrentConnection,
  syncMentionMenu: methods.syncMentionMenu,
  onKeydown: methods.onKeydown,
  handleEnterKey: methods.handleEnterKey,
  handleInput: () => undefined,
  clearAttachments: () => undefined,
  resize: () => undefined,
  focus: () => undefined,
  warn: () => undefined,
  $emit: () => undefined,
  get filteredConnections() {
    return computed.filteredConnections.get.call(this) as ConnectionMention[]
  },
  ...overrides,
})

describe('Agent mention menu', () => {
  it('should move the highlight down and up and wrap around', () => {
    const ctx = context({ message: '@', mentionQuery: { start: 0, end: 1, query: '' }, mentionMenuIndex: 0 })

    methods.moveMentionSelection.call(ctx, 1)
    expect(ctx.mentionMenuIndex).to.equal(1)

    methods.moveMentionSelection.call(ctx, 1)
    expect(ctx.mentionMenuIndex).to.equal(0)

    methods.moveMentionSelection.call(ctx, -1)
    expect(ctx.mentionMenuIndex).to.equal(1)
  })

  it('should add a chip and remove the typed @word with Enter', () => {
    const ctx = context({ mentionMenuIndex: 0 })

    methods.onKeydown.call(ctx, keyEvent('Enter'))

    expect(ctx.selectedConnections).to.deep.equal([{ id: 'c1', name: 'Alpha' }])
    expect(ctx.message).to.equal('connect to ')
    expect(ctx.mentionMenuOpen).to.equal(false)
  })

  it('should add the highlighted connection with Tab', () => {
    const ctx = context({ message: '@b', mentionQuery: { start: 0, end: 2, query: 'b' }, mentionMenuIndex: 0 })

    methods.onKeydown.call(ctx, keyEvent('Tab'))

    expect(ctx.selectedConnections).to.deep.equal([{ id: 'c2', name: 'Beta' }])
    expect(ctx.message).to.equal('')
  })

  it('should keep one chip when the same connection is mentioned twice', () => {
    const ctx = context()

    methods.applyConnection.call(ctx, connections[0])
    ctx.mentionQuery = { start: 0, end: 2, query: '@a'.slice(1) }
    ctx.message = '@alp'
    methods.applyConnection.call(ctx, connections[0])

    expect(ctx.selectedConnections).to.deep.equal([{ id: 'c1', name: 'Alpha' }])
  })

  it('should close on Escape without clearing the input', () => {
    const ctx = context({ mentionMenuIndex: 1 })

    methods.onKeydown.call(ctx, keyEvent('Escape'))

    expect(ctx.mentionMenuOpen).to.equal(false)
    expect(ctx.message).to.equal('connect to @a')
  })

  it('should not send the message while the menu is open', () => {
    let sent = false
    const ctx = context({
      isResponseStreaming: false,
      send: () => (sent = true),
      mentionMenuIndex: 0,
      filteredConnections: [],
    })

    methods.onKeydown.call(ctx, keyEvent('Enter'))

    expect(sent).to.equal(false)
    expect(ctx.mentionMenuOpen).to.equal(false)
  })

  it('should send on Enter when no menu is open', () => {
    let sent = false
    const ctx = context({ mentionMenuOpen: false, send: () => (sent = true) })

    methods.onKeydown.call(ctx, keyEvent('Enter'))

    expect(sent).to.equal(true)
  })

  it('should open on an @word before the caret and close without one', () => {
    const ctx = context({ mentionMenuOpen: false, mentionQuery: null })

    methods.syncMentionMenu.call(ctx)
    expect(ctx.mentionMenuOpen).to.equal(true)
    expect(ctx.mentionQuery).to.deep.equal({ start: 11, end: 13, query: 'a' })

    ctx.message = 'connect to alpha'
    ctx.$refs.textarea.selectionStart = 17
    methods.syncMentionMenu.call(ctx)
    expect(ctx.mentionMenuOpen).to.equal(false)
  })

  it('should not open while an IME composition is running', () => {
    const ctx = context({ mentionMenuOpen: false, mentionQuery: null, composing: true })

    methods.syncMentionMenu.call(ctx)

    expect(ctx.mentionMenuOpen).to.equal(false)
  })

  it('should not open while the Skill menu owns the input', () => {
    const ctx = context({ mentionMenuOpen: false, mentionQuery: null, skillMenuOpen: true })

    methods.syncMentionMenu.call(ctx)

    expect(ctx.mentionMenuOpen).to.equal(false)
  })

  it('should remove a chip', () => {
    const ctx = context({
      selectedConnections: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
    })

    methods.removeConnection.call(ctx, 'c1')

    expect(ctx.selectedConnections).to.deep.equal([{ id: 'c2', name: 'Beta' }])
  })

  it('should mention the current connection from the composer button', () => {
    const ctx = context({
      currentConnectionId: 'c9',
      connectionName: 'Local broker',
      selectedConnections: [],
    })

    methods.mentionCurrentConnection.call(ctx)

    expect(ctx.selectedConnections).to.deep.equal([{ id: 'c9', name: 'Local broker' }])
  })

  it('should close the mention menu with the other menus on a click outside', () => {
    const ctx = {
      showModeMenu: true,
      showModelMenu: true,
      skillMenuOpen: true,
      mentionMenuOpen: true,
      mentionQuery: { start: 0, end: 1, query: 'a' },
      closeMentionMenu: methods.closeMentionMenu,
    }

    methods.closeMenus.call(ctx)

    expect(ctx.mentionMenuOpen).to.equal(false)
    expect(ctx.mentionQuery).to.equal(null)
  })

  it('should render the menu from the shared Skill menu shell', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/agent/AgentComposer.vue'), 'utf8')
    const { ast } = compile(parseComponent(source).template!.content)
    const attr = (node: any, name: string) =>
      (node?.attrs ?? []).find((entry: any) => entry.name === name)?.value as string | undefined
    const findAll = (node: any, test: (node: any) => boolean, found: any[] = []): any[] => {
      if (test(node)) found.push(node)
      for (const child of node?.children ?? []) findAll(child, test, found)
      return found
    }

    const menu = findAll(ast, (node) => attr(node, 'data-test') === '"mention-menu"')[0]
    expect(menu, 'mention menu').to.not.equal(undefined)
    expect(menu.staticClass).to.include('skill-menu')

    const rows = findAll(menu, (node) => node.tag === 'button')
    expect(rows).to.have.length(1)
    expect(rows[0].events?.click?.value).to.include('applyConnection')

    const empty = findAll(menu, (node) => attr(node, 'data-test') === '"mention-empty"')
    expect(empty).to.have.length(1)
  })
})
