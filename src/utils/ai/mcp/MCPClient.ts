// Used on main process
import { MCPServer, ToolCallResult } from '@/types/mcp'
import { EventEmitter } from 'events'

// The SDK resolves through package `exports`, so these stay external and are loaded by Node at runtime
const { Client } = require('@modelcontextprotocol/sdk/client/index.js')
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js')
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js')
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js')

/**
 * MCPClient class implements communication with MCP server
 */
export class MCPClient extends EventEmitter {
  private client: any
  private transport: any
  private tools: any[] = []
  private connected = false

  /**
   * Connect to MCP server
   * @param config Server configuration
   * @returns Whether connection was successful
   */
  async connectToServer(config: MCPServer): Promise<boolean> {
    try {
      if (!config.url && !(config.command && config.args)) {
        throw new Error('[MCP] Invalid MCP server configuration: must provide either url or command+args')
      }

      try {
        // Check if this is a URL or command-based configuration
        if (config.url) {
          const url = new URL(config.url)
          try {
            console.log(`[MCP] Connecting to MCP Streamable HTTP server: ${config.url}`)
            await this.connectTransport(new StreamableHTTPClientTransport(url))
          } catch (httpError) {
            // Older servers only speak the deprecated HTTP+SSE transport
            console.log(`[MCP] Streamable HTTP failed, falling back to SSE: ${config.url}`, httpError)
            await this.transport.close().catch(() => undefined)
            await this.connectTransport(new SSEClientTransport(url))
          }
        } else if (config.command && config.args) {
          console.log(`[MCP] Connecting to MCP command server: ${config.command} ${config.args.join(' ')}`)
          await this.connectTransport(
            new StdioClientTransport({
              command: config.command,
              args: config.args,
              env: config.env,
            }),
          )
        }

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
   * Connect a fresh SDK client over the given transport
   * A client can only be connected once, so each transport attempt gets its own
   */
  private async connectTransport(transport: any): Promise<void> {
    transport.onerror = (error: Error) => {
      console.error('[MCP] Transport error:', error)
    }
    this.transport = transport
    this.client = new Client({
      name: 'mqttx-mcp-client',
      version: '1.0.0',
    })
    await this.client.connect(transport)
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
        isError: result.isError,
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
   * Check if connected to MCP server
   * @returns Whether connected
   */
  isConnected(): boolean {
    return this.connected
  }
}
