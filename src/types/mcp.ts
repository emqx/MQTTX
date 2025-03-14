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
