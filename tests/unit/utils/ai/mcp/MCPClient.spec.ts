import { expect } from 'chai'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { runInNewContext } from 'vm'
import type { MCPClient } from '@/utils/ai/mcp/MCPClient'

// Execute a fresh CommonJS module with a scoped require stub. Importing it through
// webpack would resolve the SDK's package exports before we could intercept loads.
const ts = __non_webpack_require__(resolve('node_modules/typescript'))
const source = ts.transpileModule(readFileSync(resolve('src/utils/ai/mcp/MCPClient.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText
const sdk = '@modelcontextprotocol/sdk/client/'
const tools = [{ name: 'echo', description: 'Echo input', inputSchema: { type: 'object' } }]

function loadClient(failHTTP = false) {
  const requests: string[] = []
  const events: string[] = []
  const connections: { client: unknown; transport: any }[] = []
  const transport = (kind: string) =>
    class {
      kind = kind
      onerror?: (error: Error) => void
      constructor(public options: unknown) {
        events.push(`${kind}:create`)
      }
      async close() {
        events.push(`${kind}:close`)
      }
    }
  const modules: Record<string, unknown> = {
    [`${sdk}index.js`]: {
      Client: class {
        async connect(transport: any) {
          connections.push({ client: this, transport })
          events.push(`${transport.kind}:connect`)
          if (failHTTP && transport.kind === 'http') {
            throw new Error('HTTP unavailable')
          }
        }
        async listTools() {
          events.push('listTools')
          return { tools }
        }
      },
    },
    [`${sdk}streamableHttp.js`]: { StreamableHTTPClientTransport: transport('http') },
    [`${sdk}sse.js`]: { SSEClientTransport: transport('sse') },
    [`${sdk}stdio.js`]: { StdioClientTransport: transport('stdio') },
  }
  const exports: { MCPClient?: new () => MCPClient } = {}
  runInNewContext(source, {
    exports,
    URL,
    console: { log() {}, error() {} },
    require(id: string) {
      if (id.startsWith('@modelcontextprotocol/sdk/')) {
        requests.push(id)
        if (!(id in modules)) {
          throw new Error(`Unexpected SDK load: ${id}`)
        }
        return modules[id]
      }
      return __non_webpack_require__(id)
    },
  })
  const MCPClient = exports.MCPClient!
  return { client: new MCPClient(), requests, events, connections }
}

describe('MCPClient lazy SDK loading', () => {
  it('loads no SDK modules when the module and client are initialized', () => {
    const { client, requests } = loadClient()

    expect(requests).to.deep.equal([])
    expect(client.isConnected()).to.equal(false)
    expect(client.getTools()).to.deep.equal([])
  })

  it('loads only HTTP and Client for a successful HTTP connection', async () => {
    const { client, requests, events, connections } = loadClient()
    let connectedTools: unknown
    client.on('connected', (tools) => {
      connectedTools = tools
    })

    expect(await client.connectToServer({ url: 'http://localhost:3000/mcp' })).to.equal(true)

    expect(requests).to.deep.equal([`${sdk}streamableHttp.js`, `${sdk}index.js`])
    expect(events).to.deep.equal(['http:create', 'http:connect', 'listTools'])
    expect(connections[0].transport.options.href).to.equal('http://localhost:3000/mcp')
    expect(connections[0].transport.onerror).to.be.a('function')
    expect(connectedTools).to.deep.equal([
      { name: 'echo', description: 'Echo input', input_schema: { type: 'object' } },
    ])
    expect(client.isConnected()).to.equal(true)
    await client.disconnect()
    expect(events[events.length - 1]).to.equal('http:close')
    expect(client.isConnected()).to.equal(false)
  })

  it('loads SSE only after HTTP fails and closes, using a fresh Client', async () => {
    const { client, requests, events, connections } = loadClient(true)

    expect(await client.connectToServer({ url: 'http://localhost:3000/mcp' })).to.equal(true)

    expect(requests).to.deep.equal([`${sdk}streamableHttp.js`, `${sdk}index.js`, `${sdk}sse.js`, `${sdk}index.js`])
    expect(events).to.deep.equal([
      'http:create',
      'http:connect',
      'http:close',
      'sse:create',
      'sse:connect',
      'listTools',
    ])
    expect(connections[0].client).not.to.equal(connections[1].client)
    expect(connections[0].transport.options).to.equal(connections[1].transport.options)
    expect(client.isConnected()).to.equal(true)
  })

  it('loads only stdio and Client and forwards command, args and env', async () => {
    const { client, requests, events, connections } = loadClient()
    const config = { command: 'mcp-server', args: ['--name', 'with spaces'], env: { MCP_TEST: 'value' } }

    expect(await client.connectToServer(config)).to.equal(true)

    expect(requests).to.deep.equal([`${sdk}stdio.js`, `${sdk}index.js`])
    expect(events).to.deep.equal(['stdio:create', 'stdio:connect', 'listTools'])
    expect(connections[0].transport.options).to.deep.equal(config)
    expect(client.isConnected()).to.equal(true)
  })
})
