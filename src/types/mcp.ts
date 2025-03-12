export interface MCPConfig {
  mcpServers: Record<string, MCPServer>
}

export interface MCPServer {
  command: string
  args: string[]
}
