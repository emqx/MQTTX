export interface MCPConfig {
  mcpServers: Record<string, MCPServer>
}

export interface MCPServer {
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface ToolCallResult {
  name: string
  arguments: any
  content: string
  error?: string
}

/**
 * Interface for enabled MCP server information
 */
export interface EnabledMCPServer {
  name: string
  tools: {
    name: string
    description: string
    input_schema: any
  }[]
}

/**
 * Interface for MCP prompt data
 */
export interface MCPPromptData {
  serversSection: string
  toolsSection: string
  hasMCP: boolean
}
