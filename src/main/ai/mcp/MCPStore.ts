import Store from 'electron-store'
import { MCPConfig, MCPServer, MCPStoreSchema } from '@/types/mcp'

/**
 * MCP Store for managing MCP-related configuration in the main process
 * Uses a proper hierarchical structure for storing MCP data
 */
export class MCPStore {
  private store: Store<MCPStoreSchema>

  /**
   * Create a new MCPStore instance
   */
  constructor() {
    this.store = new Store<MCPStoreSchema>()
  }

  /**
   * Get MCPEnabled setting
   * @returns boolean indicating whether MCP is enabled
   */
  getMCPEnabled(): boolean {
    return this.store.get('mcp.enabled', false) as boolean
  }

  /**
   * Set MCPEnabled setting
   * @param value Boolean value to set
   */
  setMCPEnabled(value: boolean): void {
    this.store.set('mcp.enabled', value)
  }

  /**
   * Get complete MCP configuration
   * @returns MCPConfig object or empty default if none exists
   */
  getMCPConfig(): MCPConfig {
    return this.store.get('mcp.config', { mcpServers: {} }) as MCPConfig
  }

  /**
   * Set complete MCP configuration
   * @param config MCPConfig object or JSON string
   */
  setMCPConfig(config: MCPConfig | string): void {
    if (typeof config === 'string') {
      try {
        const parsedConfig = JSON.parse(config) as MCPConfig
        this.store.set('mcp.config', parsedConfig)
      } catch (error) {
        console.error('[MCPStore] Failed to parse config string:', error)
      }
    } else {
      this.store.set('mcp.config', config)
    }
  }

  /**
   * Get server configuration by name
   * @param serverName Name of the server
   * @returns Server configuration or undefined if not found
   */
  getServerConfig(serverName: string): MCPServer | undefined {
    const config = this.getMCPConfig()
    return config.mcpServers[serverName]
  }

  /**
   * Set server enabled status
   * @param serverName Name of the server
   * @param enabled Whether the server is enabled
   */
  setServerEnabled(serverName: string, enabled: boolean): void {
    this.ensureServerExists(serverName)
    this.store.set(`mcp.servers.${serverName}.enabled`, enabled)
  }

  /**
   * Get server enabled status
   * @param serverName Name of the server
   * @returns Boolean indicating if server is enabled
   */
  getServerEnabled(serverName: string): boolean {
    return this.store.get(`mcp.servers.${serverName}.enabled`, false) as boolean
  }

  /**
   * Set server test results
   * @param serverName Name of the server
   * @param results Test results object
   */
  setServerTestResults(serverName: string, results: any): void {
    this.ensureServerExists(serverName)
    this.store.set(`mcp.servers.${serverName}.testResults`, results)
  }

  /**
   * Get server test results
   * @param serverName Name of the server
   * @returns Test results object or undefined if not found
   */
  getServerTestResults(serverName: string): any | undefined {
    return this.store.get(`mcp.servers.${serverName}.testResults`)
  }

  /**
   * Ensure server entry exists
   * @param serverName Name of the server
   */
  private ensureServerExists(serverName: string): void {
    const path = `mcp.servers.${serverName}`
    if (!this.store.has(path)) {
      this.store.set(path, {
        enabled: false,
        testResults: null,
      })
    }
  }

  /**
   * Delete server data (configuration, enabled status, test results)
   * @param serverName Name of the server
   */
  deleteServerData(serverName: string): void {
    // Remove server from config
    const config = this.getMCPConfig()

    if (config.mcpServers && config.mcpServers[serverName]) {
      delete config.mcpServers[serverName]
      this.setMCPConfig(config)
    }

    // Remove server-specific data
    const servers = this.store.get('mcp.servers', {}) as Record<string, any>
    if (servers[serverName]) {
      delete servers[serverName]
      this.store.set('mcp.servers', servers)
    }
  }

  /**
   * Check if MCP is enabled and has valid configuration
   * @returns Boolean indicating if MCP is ready to use
   */
  isMCPReady(): boolean {
    if (!this.getMCPEnabled()) {
      return false
    }

    const config = this.getMCPConfig()
    return !!config && !!config.mcpServers && Object.keys(config.mcpServers).length > 0
  }

  /**
   * Get all enabled servers
   * @returns Array of [serverName, serverConfig] tuples for enabled servers
   */
  getEnabledServers(): [string, MCPServer][] {
    const config = this.getMCPConfig()
    const enabledServers: [string, MCPServer][] = []

    if (config.mcpServers) {
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (this.getServerEnabled(name)) {
          enabledServers.push([name, server])
        }
      }
    }

    return enabledServers
  }
}

// Export a singleton instance
export const mcpStore = new MCPStore()
