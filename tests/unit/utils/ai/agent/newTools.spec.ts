import { expect } from 'chai'
import { ipcRenderer } from 'electron'
import { createConnectionTools } from '@/utils/ai/agent/tools/connections'
import { createScriptTools } from '@/utils/ai/agent/tools/scripts'
import { createTopicTreeTools } from '@/utils/ai/agent/tools/topicTree'
import { createDashboardTools } from '@/utils/ai/agent/tools/dashboards'
import { createGroupTools } from '@/utils/ai/agent/tools/groups'
import { createSettingsTools } from '@/utils/ai/agent/tools/settings'
import { redactLogLine } from '@/utils/ai/agent/tools/logs'
import { createPageTools } from '@/utils/ai/agent/tools/pages'
import { AGENT_ALWAYS_ASK_TOOLS, AGENT_WRITE_TOOLS, createMQTTTools } from '@/utils/ai/agent/tools'
import agentMessages from '@/lang/agent'

const LANGUAGES = ['zh', 'en', 'tr', 'ja', 'hu', 'ko'] as const

interface Spies {
  dispatched: { type: string; payload: any }[]
  pushed: string[]
  created: any[]
  updated: any[]
  widgets: any[]
  deleted: string[]
}

const makeDeps = (spies: Spies, overrides: Record<string, any> = {}): any => {
  const scripts = [
    { id: 's1', name: 'a.js', script: 'body', type: 'javascript' },
    { id: 's2', name: 'p.proto', script: 'proto', type: 'protobuf' },
  ]
  const widgets: any[] = []
  const deps: any = {
    bridge: {
      current: () => null,
      open: async () => {
        throw new Error('open not faked')
      },
    },
    services: {
      connectionService: {
        getAll: async () => [{ id: 'c1', name: 'C1', parentId: null }],
        get: async (id: string) => (id === 'c1' ? { id: 'c1', name: 'C1', parentId: null } : undefined),
        create: async (data: any) => ({ ...data, id: 'c1' }),
        update: async (id: string, data: any) => ({ ...data, id }),
        updateCollectionId: async () => undefined,
      },
      messageService: {
        cleanInConnection: async () => undefined,
        getMessageTopicNodeStats: async () => ({
          connection: { id: 'c1', host: 'broker.example.com' },
          topicStats: [
            { msgTopic: 'a/b', msgCount: 2, lastTime: '2026-01-01' },
            { msgTopic: 'a/c', msgCount: 1, lastTime: '2026-01-02' },
          ],
        }),
      },
      topicNodeService: {
        getTree: async () => [],
        updateTopicNodes: async () => undefined,
        clearTree: async () => undefined,
        deleteTopicNodesForConnection: async () => undefined,
      },
      collectionService: {
        getAll: async () => [
          { id: 'g1', name: 'Group', isCollection: true, children: [{ id: 'c1', name: 'C1', isCollection: false }] },
        ],
        add: async (data: any) => data,
        update: async () => undefined,
        delete: async (id: string) => {
          spies.deleted.push(id)
        },
      },
      scriptService: {
        getAll: async () => scripts,
        getAllFunction: async () => scripts.filter((s) => s.type === 'javascript'),
        getAllSchema: async () => scripts.filter((s) => s.type !== 'javascript'),
        get: async (id: string) => scripts.find((s) => s.id === id),
        create: async (data: any) => {
          spies.created.push(data)
          return { ...data, id: 'new' }
        },
        update: async (id: string, data: any) => {
          spies.updated.push({ id, data })
          return { ...data, id }
        },
        delete: async () => undefined,
      },
      dashboardService: {
        getAll: async () => [{ id: 'd1', name: 'Dash' }],
        cascadeGetAll: async () => [{ id: 'd1', name: 'Dash', widgets: [] }],
        create: async (data: any) => {
          spies.created.push(data)
          return { ...data, id: 'd1' }
        },
        update: async (id: string, data: any) => {
          spies.updated.push({ id, data })
          return { id, ...data }
        },
        delete: async (id: string) => ({ id, name: 'Dash' }),
      },
      widgetService: {
        getAll: async () => widgets,
        get: async (id: string) => widgets.find((w) => w.id === id),
        create: async (data: any) => {
          spies.created.push(data)
          return { ...data, id: 'w1' }
        },
        update: async (id: string, data: any) => {
          spies.updated.push({ id, data })
          return { id, ...data }
        },
        delete: async (id: string) => ({ id, title: 'W' }),
      },
    },
    store: {
      getters: {
        currentScript: null,
        currentTheme: 'light',
        currentLang: 'en',
        syncOsTheme: false,
        autoCheck: true,
        autoResub: false,
        multiTopics: false,
        jsonHighlight: true,
        maxReconnectTimes: 10,
        maxPayloadDisplaySize: 65536,
        logLevel: 'info',
        ignoreQoS0Message: false,
        topicWhitespaceDetection: false,
        agentPermissionMode: 'ask',
        agentMaxSteps: 50,
        enableHardwareAcceleration: true,
        openAIAPIKey: 'secret',
        openAIAPIHost: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        enableAgent: true,
      },
      dispatch: async (type: string, payload: any) => {
        spies.dispatched.push({ type, payload })
      },
    },
    router: {
      push: async (path: string) => {
        spies.pushed.push(path)
      },
      currentRoute: { path: '/', query: {}, params: {} },
    },
    getPermissionMode: () => 'ask',
    getConversationId: () => 'conv',
    ...overrides,
  }
  return deps
}

const makeSpies = (): Spies => ({ dispatched: [], pushed: [], created: [], updated: [], widgets: [], deleted: [] })

describe('agent tools — scripts', () => {
  it('should list scripts with their kind and applied state', async () => {
    const spies = makeSpies()
    const deps = makeDeps(spies)
    deps.store.getters.currentScript = { apply: 'all', function: { id: 's1', name: 'a.js' } }
    const tools = createScriptTools(deps)

    const result: any = await tools.list_scripts.execute!({} as any, {} as any)
    expect(result.scripts).to.have.length(2)
    expect(result.scripts[0]).to.include({ id: 's1', kind: 'function', inUse: true })
    expect(result.scripts[1]).to.include({ id: 's2', kind: 'schema', inUse: false })
  })

  it('should add the type extension and reject a duplicate name', async () => {
    const spies = makeSpies()
    const tools = createScriptTools(makeDeps(spies))

    const created: any = await tools.save_script.execute!(
      { name: 'demo', type: 'javascript', script: 'x' } as any,
      {} as any,
    )
    expect(created.name).to.equal('demo.js')
    expect(spies.created[0].name).to.equal('demo.js')

    let error: Error | undefined
    try {
      await tools.save_script.execute!({ name: 'a', type: 'javascript', script: 'x' } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('already exists')
  })

  it('should refuse to delete a script that is in use', async () => {
    const spies = makeSpies()
    const deps = makeDeps(spies)
    deps.store.getters.currentScript = { apply: 'all', function: { id: 's1', name: 'a.js' } }
    const tools = createScriptTools(deps)

    let error: Error | undefined
    try {
      await tools.delete_script.execute!({ id: 's1' } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('in use')
  })

  it('should run a javascript test in the sandbox', async () => {
    const tools = createScriptTools(makeDeps(makeSpies()))
    const result: any = await tools.test_script.execute!(
      {
        script: 'function handlePayload(value) { return value }\nexecute(handlePayload)',
        type: 'javascript',
        input: 'hello',
        inputType: 'Plaintext',
      } as any,
      {} as any,
    )
    expect(result.result).to.equal('hello')
  })

  it('should require protoName for a protobuf test', async () => {
    const tools = createScriptTools(makeDeps(makeSpies()))
    let error: Error | undefined
    try {
      await tools.test_script.execute!({ script: 'x', type: 'protobuf', input: '{}' } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('protoName')
  })

  it('should apply a script through the SET_SCRIPT action', async () => {
    const spies = makeSpies()
    const tools = createScriptTools(makeDeps(spies))
    await tools.apply_script.execute!({ functionId: 's1', apply: 'all' } as any, {} as any)

    expect(spies.dispatched).to.have.length(1)
    expect(spies.dispatched[0].type).to.equal('SET_SCRIPT')
    expect(spies.dispatched[0].payload.currentScript.function.id).to.equal('s1')
  })

  it('should clear the applied script', async () => {
    const spies = makeSpies()
    const tools = createScriptTools(makeDeps(spies))
    await tools.clear_applied_script.execute!({} as any, {} as any)
    expect(spies.dispatched[0].payload.currentScript).to.equal(null)
  })
})

describe('agent tools — topic tree', () => {
  it('should sync the topic tree from stored messages', async () => {
    const tools = createTopicTreeTools(makeDeps(makeSpies()))
    const result: any = await tools.sync_topic_tree.execute!({ connectionId: 'c1' } as any, {} as any)
    expect(result).to.include({ connection: 'broker.example.com', topics: 2, messages: 3 })
  })

  it('should truncate a topic tree larger than 200 nodes', async () => {
    const spies = makeSpies()
    const deps = makeDeps(spies)
    const children = Array.from({ length: 300 }, (_, index) => ({
      id: `n${index}`,
      label: `t${index}`,
      messageCount: 1,
      subTopicCount: 0,
      children: [],
    }))
    deps.services.topicNodeService.getTree = async () => [{ id: 'c1', label: 'host', children }]
    const tools = createTopicTreeTools(deps)

    const result: any = await tools.get_topic_tree.execute!({} as any, {} as any)
    expect(result.truncated).to.equal(true)
    expect(result.topics).to.have.length(200)
  })
})

describe('agent tools — dashboards', () => {
  it('should create a widget with the page layout', async () => {
    const spies = makeSpies()
    const tools = createDashboardTools(makeDeps(spies))
    await tools.save_widget.execute!(
      { dashboardId: 'd1', type: 'Gauge', connectionId: 'c1', topicPattern: 'a/#', valueField: 'temp' } as any,
      {} as any,
    )
    const payload = spies.created[0]
    expect(payload).to.include({ x: 0, y: 0, w: 4, h: 6, topicPattern: 'a/#', valueField: 'temp' })
    expect(payload.widgetOptions).to.include({ decimals: 1, color: '#00B572' })
  })

  it('should reject a widget for an unknown dashboard', async () => {
    const tools = createDashboardTools(makeDeps(makeSpies()))
    let error: Error | undefined
    try {
      await tools.save_widget.execute!(
        { dashboardId: 'nope', type: 'Line', connectionId: 'c1', topicPattern: 'a' } as any,
        {} as any,
      )
    } catch (caught) {
      error = caught as Error
    }
    expect(error?.message).to.contain('not found')
  })
})

describe('agent tools — groups', () => {
  it('should list groups with their connection count', async () => {
    const tools = createGroupTools(makeDeps(makeSpies()))
    const result: any = await tools.list_groups.execute!({} as any, {} as any)
    expect(result.groups).to.deep.equal([
      { id: 'g1', name: 'Group', parentId: null, orderId: undefined, connectionCount: 1 },
    ])
  })

  it('should create a group', async () => {
    const spies = makeSpies()
    const tools = createGroupTools(makeDeps(spies))
    const result: any = await tools.save_group.execute!({ name: 'New' } as any, {} as any)
    expect(result.name).to.equal('New')
    expect(result.id).to.match(/^collection_/)
  })

  it('should delete an empty group, including its empty sub-groups', async () => {
    const spies = makeSpies()
    const deps = makeDeps(spies)
    deps.services.collectionService.getAll = async () => [
      {
        id: 'g1',
        name: 'Empty',
        isCollection: true,
        children: [{ id: 'g2', name: 'Sub', isCollection: true, children: [] }],
      },
    ]
    const tools = createGroupTools(deps)

    const result: any = await tools.delete_group.execute!({ groupId: 'g1' } as any, {} as any)

    expect(result).to.deep.equal({ deleted: true, name: 'Empty' })
    expect(spies.deleted).to.deep.equal(['g1'])
  })

  it('should refuse to delete a group that still holds a connection', async () => {
    const spies = makeSpies()
    const tools = createGroupTools(makeDeps(spies))

    let error: Error | undefined
    try {
      await tools.delete_group.execute!({ groupId: 'g1' } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }

    expect(error?.message).to.contain('1 connection')
    expect(spies.deleted).to.deep.equal([])
  })

  it('should refuse to delete a group whose sub-group still holds a connection', async () => {
    const spies = makeSpies()
    const deps = makeDeps(spies)
    deps.services.collectionService.getAll = async () => [
      {
        id: 'g1',
        name: 'Parent',
        isCollection: true,
        children: [
          { id: 'g2', name: 'Sub', isCollection: true, children: [{ id: 'c1', name: 'C1', isCollection: false }] },
        ],
      },
    ]
    const tools = createGroupTools(deps)

    let error: Error | undefined
    try {
      await tools.delete_group.execute!({ groupId: 'g1' } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }

    expect(error?.message).to.contain('1 connection')
    expect(spies.deleted).to.deep.equal([])
  })

  it('should reject an unknown group id', async () => {
    const spies = makeSpies()
    const tools = createGroupTools(makeDeps(spies))

    let error: Error | undefined
    try {
      await tools.delete_group.execute!({ groupId: 'nope' } as any, {} as any)
    } catch (caught) {
      error = caught as Error
    }

    expect(error?.message).to.contain('Group nope not found')
    expect(spies.deleted).to.deep.equal([])
  })

  it('should move a connection into a group through update_connection', async () => {
    const spies = makeSpies()
    const deps = makeDeps(spies)
    let moved: { id: string; groupId: string | null } | undefined
    deps.services.connectionService.updateCollectionId = async (id: string, groupId: string | null) => {
      moved = { id, groupId }
    }
    const tools = createConnectionTools(deps)
    await tools.update_connection.execute!({ connectionId: 'c1', changes: { groupId: 'g1' } } as any, {} as any)
    expect(moved).to.deep.equal({ id: 'c1', groupId: 'g1' })
  })
})

describe('agent tools — settings', () => {
  const originalSend = ipcRenderer.send
  let sent: unknown[][]

  beforeEach(() => {
    sent = []
    ;(ipcRenderer as any).send = (...args: unknown[]) => {
      sent.push(args)
    }
  })

  afterEach(() => {
    ;(ipcRenderer as any).send = originalSend
  })

  it('should read the whitelisted settings and never the secrets', async () => {
    const tools = createSettingsTools(makeDeps(makeSpies()))
    const result: any = await tools.get_settings.execute!({} as any, {} as any)

    expect(result).to.include({
      currentTheme: 'light',
      currentLang: 'en',
      maxReconnectTimes: 10,
      logLevel: 'info',
      agentPermissionMode: 'ask',
      agentMaxSteps: 50,
      model: 'gpt-4o',
      enableHardwareAcceleration: true,
    })
    expect(result).to.not.have.property('openAIAPIKey')
    expect(result).to.not.have.property('openAIAPIHost')
    expect(result).to.not.have.property('enableAgent')
  })

  it('should change a boolean setting', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    const result: any = await tools.update_settings.execute!({ autoResub: true } as any, {} as any)

    expect(spies.dispatched).to.deep.equal([{ type: 'TOGGLE_AUTO_RESUB', payload: { autoResub: true } }])
    expect(result.updated).to.deep.equal({ autoResub: true })
    expect(sent).to.deep.equal([])
  })

  it('should change an enum setting and send the matching IPC', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    const result: any = await tools.update_settings.execute!({ currentTheme: 'dark' } as any, {} as any)

    expect(spies.dispatched[0]).to.deep.equal({ type: 'TOGGLE_THEME', payload: { currentTheme: 'dark' } })
    expect(sent).to.deep.equal([['setting', 'theme', 'dark']])
    expect(result.updated).to.deep.equal({ currentTheme: 'dark' })
  })

  it('should change number settings', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    const result: any = await tools.update_settings.execute!(
      { maxReconnectTimes: 20, maxPayloadDisplaySize: 32768 } as any,
      {} as any,
    )

    expect(spies.dispatched).to.deep.equal([
      { type: 'SET_MAX_RECONNECT_TIMES', payload: { maxReconnectTimes: 20 } },
      { type: 'SET_MAX_PAYLOAD_DISPLAY_SIZE', payload: { maxPayloadDisplaySize: 32768 } },
    ])
    expect(result.updated).to.deep.equal({ maxReconnectTimes: 20, maxPayloadDisplaySize: 32768 })
  })

  it('should change the language and send the language IPC', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    await tools.update_settings.execute!({ currentLang: 'zh' } as any, {} as any)

    expect(spies.dispatched[0]).to.deep.equal({ type: 'TOGGLE_LANG', payload: { currentLang: 'zh' } })
    expect(sent).to.deep.equal([['setting', 'lang', 'zh']])
  })

  it('should apply the OS theme when syncOsTheme is switched on', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    const result: any = await tools.update_settings.execute!({ syncOsTheme: true } as any, {} as any)

    expect(spies.dispatched).to.deep.equal([
      { type: 'TOGGLE_THEME', payload: { currentTheme: 'light' } },
      { type: 'TOGGLE_SYNC_OS_THEME', payload: { syncOsTheme: true } },
    ])
    expect(sent).to.deep.equal([['setting', 'theme', 'light']])
    expect(result.updated).to.deep.equal({ currentTheme: 'light', syncOsTheme: true })
  })

  it('should reject out-of-range numbers without changing anything', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    for (const input of [{ maxReconnectTimes: 0 }, { maxPayloadDisplaySize: 10 }]) {
      let error: unknown
      try {
        await tools.update_settings.execute!(input as any, {} as any)
      } catch (caught) {
        error = caught
      }
      expect(error, JSON.stringify(input)).to.be.instanceOf(Error)
    }
    expect(spies.dispatched).to.deep.equal([])
    expect(sent).to.deep.equal([])
  })

  it('should reject unknown and disallowed fields without changing anything', async () => {
    const spies = makeSpies()
    const tools = createSettingsTools(makeDeps(spies))
    for (const input of [{ openAIAPIKey: 'x' }, { agentPermissionMode: 'auto' }, { enableAgent: false }, { nope: 1 }]) {
      let error: unknown
      try {
        await tools.update_settings.execute!(input as any, {} as any)
      } catch (caught) {
        error = caught
      }
      expect(error, JSON.stringify(input)).to.be.instanceOf(Error)
    }
    expect(spies.dispatched).to.deep.equal([])
    expect(sent).to.deep.equal([])
  })

  it('should require approval for update_settings but not for get_settings', () => {
    expect(AGENT_WRITE_TOOLS.has('update_settings')).to.equal(true)
    expect(AGENT_WRITE_TOOLS.has('get_settings')).to.equal(false)
  })
})

describe('agent tools — logs', () => {
  it('should redact secret values', () => {
    expect(redactLogLine('password=secret123 user=bob')).to.equal('password=*** user=bob')
    expect(redactLogLine('{"password":"secret","topic":"a"}')).to.equal('{"password":"***","topic":"a"}')
    expect(redactLogLine('Authorization: Bearer abc.def')).to.equal('Authorization: ***')
  })
})

describe('agent tools — pages', () => {
  it('should navigate and ask the panel to leave full screen', async () => {
    const spies = makeSpies()
    const tools = createPageTools(makeDeps(spies))
    const result: any = await tools.open_page.execute!({ page: 'script' } as any, {} as any)
    expect(result.path).to.equal('/script')
    expect(spies.pushed).to.deep.equal(['/script'])
  })
})

describe('agent tools — write-tool sets', () => {
  /** Tools that are safe to run without approval; every other tool must be listed in AGENT_WRITE_TOOLS */
  const READ_ONLY_TOOLS = new Set([
    'list_connections',
    'get_connection',
    'open_connection',
    'get_messages',
    'wait_for_messages',
    'stop_timed_publish',
    'list_groups',
    'get_app_context',
    'use_skill',
    'save_files',
    'inspect_certificate',
    'list_scripts',
    'get_script',
    'sync_topic_tree',
    'get_topic_tree',
    'list_dashboards',
    'get_settings',
    'read_logs',
    'open_page',
  ])

  it('should classify every tool exactly once', () => {
    const tools = createMQTTTools(makeDeps(makeSpies()))
    for (const name of Object.keys(tools)) {
      const write = AGENT_WRITE_TOOLS.has(name)
      const readOnly = READ_ONLY_TOOLS.has(name)
      expect(write || readOnly, `${name} is not classified as write or read-only`).to.equal(true)
      expect(write && readOnly, `${name} is in both sets`).to.equal(false)
    }
    for (const name of AGENT_WRITE_TOOLS) {
      expect(tools, `AGENT_WRITE_TOOLS lists an unknown tool: ${name}`).to.have.property(name)
    }
    for (const name of AGENT_ALWAYS_ASK_TOOLS) {
      expect(AGENT_WRITE_TOOLS.has(name), `${name} must also be a write tool`).to.equal(true)
    }
  })

  it('should require approval for the unsafe tools and not for the read-only ones', () => {
    for (const name of [
      'save_script',
      'delete_script',
      'test_script',
      'apply_script',
      'clear_applied_script',
      'clear_messages',
      'update_settings',
      'save_group',
      'delete_group',
    ]) {
      expect(AGENT_WRITE_TOOLS.has(name), name).to.equal(true)
    }
    for (const name of [
      'sync_topic_tree',
      'stop_timed_publish',
      'open_page',
      'read_logs',
      'get_settings',
      'list_groups',
      'get_topic_tree',
    ]) {
      expect(AGENT_WRITE_TOOLS.has(name), name).to.equal(false)
    }
    expect(AGENT_ALWAYS_ASK_TOOLS.has('test_script')).to.equal(true)
  })

  it('should give every tool running and done labels in all six languages', () => {
    const tools = createMQTTTools(makeDeps(makeSpies()))
    const lang = agentMessages as any
    for (const name of Object.keys(tools)) {
      for (const language of LANGUAGES) {
        expect(lang.tools?.[name]?.running?.[language], `${name}.running.${language}`).to.be.a('string').that.is.not
          .empty
        expect(lang.tools?.[name]?.done?.[language], `${name}.done.${language}`).to.be.a('string').that.is.not.empty
      }
    }
  })
})
