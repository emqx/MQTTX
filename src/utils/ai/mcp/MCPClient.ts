// Used on main process
import { MCPServer, ToolCallResult } from '@/types/mcp'
import { EventEmitter } from 'events'

const { Client } = require('@modelcontextprotocol/sdk/dist/esm/client/index.js')
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/dist/esm/client/sse.js')
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/dist/esm/client/stdio.js')
const { spawn } = require('child_process')

/**
 * MCPClient class implements communication with MCP server
 */
export class MCPClient extends EventEmitter {
  private client: any
  private transport: any
  private tools: any[] = []
  private connected: boolean = false
  private serverProcess: any = null

  /**
   * Create MCP client instance
   */
  constructor() {
    super()
    this.client = new Client({
      name: 'mqttx-mcp-client',
      version: '1.0.0',
    })
  }

  /**
   * Connect to MCP server
   * @param config Server configuration
   * @returns Whether connection was successful
   */
  async connectToServer(config: MCPServer): Promise<boolean> {
    try {
      // Check if this is an SSE or command-based configuration
      if (config.url) {
        console.log(`[MCP] Connecting to MCP SSE server: ${config.url}`)

        // Create SSE transport layer
        this.transport = new SSEClientTransport(new URL(config.url))

        this.transport.onerror = (error: Error) => {
          console.error('[MCP] SSE transport error:', error)
          this.emit('error', error)
        }
      } else if (config.command && config.args) {
        console.log(`[MCP] Connecting to MCP command server: ${config.command} ${config.args.join(' ')}`)

        // Create stdio transport layer
        this.transport = new StdioClientTransport({
          command: config.command,
          args: config.args,
          env: config.env,
        })

        this.transport.onerror = (error: Error) => {
          console.error('[MCP] Command transport error:', error)
          this.emit('error', error)
        }
      } else {
        throw new Error('[MCP] Invalid MCP server configuration: must provide either url or command+args')
      }

      try {
        // Connect to server
        await this.client.connect(this.transport)
        // Get available tools list
        const toolsResult = await this.client.listTools()
        this.tools = toolsResult.tools.map((tool: any) => {
          return {
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
          }
        })

        console.log(
          `[MCP] Connected to MCP server, available tools:`,
          this.tools.map(({ name }: { name: string }) => name),
        )

        this.connected = true
        this.emit('connected', this.tools)
        return true
      } catch (connectError) {
        console.error('[MCP] Failed to connect or list tools:', connectError)
        this.emit('error', connectError)

        // Clean up transport on connection failure
        if (this.transport) {
          try {
            await this.transport.close()
          } catch (closeError) {
            console.error('[MCP] Error closing transport after failed connection:', closeError)
          }
        }
        return false
      }
    } catch (error) {
      console.error('[MCP] Failed to initialize MCP server connection:', error)
      this.emit('error', error)
      return false
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        if (this.transport) {
          await this.transport.close()
        }
        this.connected = false
        this.emit('disconnected')
        console.log('[MCP] Disconnected from MCP server')
      } catch (error) {
        console.error('[MCP] Failed to disconnect from MCP server:', error)
        this.emit('error', error)
      }
    }
  }

  /**
   * Get available tools list
   * @returns Tools list
   */
  getTools(): any[] {
    return this.tools
  }

  /**
   * Call MCP tool
   * @param toolName Tool name
   * @param toolArgs Tool arguments
   * @returns Call result
   */
  async callTool(toolName: string, toolArgs: any): Promise<ToolCallResult> {
    if (!this.connected) {
      throw new Error('[MCP] Not connected to MCP server')
    }

    try {
      console.log(`[MCP] Calling tool: ${toolName}, arguments:`, toolArgs)

      const result = await this.client.callTool({
        name: toolName,
        arguments: toolArgs,
      })

      console.log(`[MCP] Tool call result:`, result)

      return {
        name: toolName,
        arguments: toolArgs,
        content: result.content,
      }
    } catch (error) {
      console.error(`[MCP] Tool call failed (${toolName}):`, error)
      this.emit('toolError', { toolName, error })

      return {
        name: toolName,
        arguments: toolArgs,
        content: '',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Start MCP server process
   * @param serverPath Server script path
   * @returns Started process
   */
  startServerProcess(serverPath: string): any {
    try {
      const isJs = serverPath.endsWith('.js')
      const isPy = serverPath.endsWith('.py')

      if (!isJs && !isPy) {
        throw new Error('[MCP] Server script must be a .js or .py file')
      }

      const command = isPy ? (process.platform === 'win32' ? 'python' : 'python3') : process.execPath

      const args = [serverPath]

      console.log(`[MCP] Starting MCP server process: ${command} ${args.join(' ')}`)

      this.serverProcess = spawn(command, args, {
        stdio: 'pipe',
      })

      this.serverProcess.stdout.on('data', (data: any) => {
        console.log(`[MCP] MCP server output: ${data}`)
      })

      this.serverProcess.stderr.on('data', (data: any) => {
        console.error(`[MCP] MCP server error: ${data}`)
      })

      this.serverProcess.on('close', (code: number) => {
        console.log(`[MCP] MCP server process exited with code: ${code}`)
        this.serverProcess = null
        this.emit('serverClosed', code)
      })

      return this.serverProcess
    } catch (error) {
      console.error('[MCP] Failed to start MCP server process:', error)
      this.emit('error', error)
      return null
    }
  }

  /**
   * Stop MCP server process
   */
  stopServerProcess(): void {
    if (this.serverProcess) {
      console.log('[MCP] Stopping MCP server process')
      this.serverProcess.kill()
      this.serverProcess = null
    }
  }

  /**
   * Check if connected to MCP server
   * @returns Whether connected
   */
  isConnected(): boolean {
    return this.connected
  }
}
