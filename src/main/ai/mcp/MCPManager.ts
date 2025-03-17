/**
 * MCP Manager for Main Process
 *
 * This module manages MCP operations in the main process, serving as a bridge
 * between renderer process UI and MCP server communication.
 */

import { ipcMain } from 'electron'
import { MCPClient } from '@/utils/ai/mcp'
import { MCPServer } from '@/types/mcp'

// Store active MCP client instances
const activeClients: Map<string, MCPClient> = new Map()

/**
 * Initialize MCP IPC handlers
 */
export function initMCPHandlers(): void {
  // Test connection to a server
  ipcMain.handle('mcp:test-connection', async (_, serverConfig: MCPServer, serverName: string) => {
    console.log(`[MCP] Testing connection to MCP server: ${serverName}`)
    try {
      const client = new MCPClient()
      const connected = await client.connectToServer(serverConfig)

      if (connected) {
        const tools = client.getTools()
        console.log(`Successfully connected to MCP server: ${serverName}`)
        console.log(`Available tools: ${tools.map((t) => t.name).join(', ')}`)

        // Store client for later use
        if (activeClients.has(serverName)) {
          const oldClient = activeClients.get(serverName)
          if (oldClient) {
            await oldClient.disconnect()
          }
        }
        activeClients.set(serverName, client)

        return {
          success: true,
          tools,
          message: `Successfully connected to MCP server: ${serverName}`,
        }
      } else {
        console.error(`Failed to connect to MCP server: ${serverName}`)
        return {
          success: false,
          message: `Failed to connect to MCP server: ${serverName}`,
        }
      }
    } catch (error) {
      console.error(`Error testing connection to MCP server: ${serverName}`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // Call a tool on a specific server
  ipcMain.handle('mcp:call-tool', async (_, serverName: string, toolName: string, toolArgs: any) => {
    console.log(`[MCP] Calling tool ${toolName} on server ${serverName}`)

    try {
      const client = activeClients.get(serverName)
      if (!client) {
        // If server is not connected, try to auto-connect
        await autoConnectToServer(serverName)
        const reconnectedClient = activeClients.get(serverName)
        if (!reconnectedClient) {
          throw new Error(`[MCP] No active connection to server: ${serverName} and auto-reconnect failed`)
        }

        const result = await reconnectedClient.callTool(toolName, toolArgs)
        return {
          success: true,
          result,
        }
      }

      if (!client.isConnected()) {
        throw new Error(`[MCP] Connection to server ${serverName} has been lost`)
      }

      const result = await client.callTool(toolName, toolArgs)
      return {
        success: true,
        result,
      }
    } catch (error) {
      console.error(`[MCP] Error calling tool ${toolName} on server ${serverName}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // Disconnect from a server
  ipcMain.handle('mcp:disconnect', async (_, serverName: string) => {
    console.log(`[MCP] Disconnecting from MCP server: ${serverName}`)

    try {
      const client = activeClients.get(serverName)
      if (client) {
        await client.disconnect()
        activeClients.delete(serverName)
        return {
          success: true,
          message: `Disconnected from server: ${serverName}`,
        }
      }
      return {
        success: true,
        message: `No active connection to server: ${serverName}`,
      }
    } catch (error) {
      console.error(`[MCP] Error disconnecting from MCP server: ${serverName}`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // Auto-connect to enabled MCP servers
  autoConnectToEnabledServers()
}

/**
 * Automatically connect to enabled MCP servers
 */
async function autoConnectToEnabledServers(): Promise<void> {
  console.log('[MCP] Checking for enabled MCP servers to auto-connect')

  try {
    // Read MCP configuration from local storage
    const Store = require('electron-store')
    const store = new Store()

    // Check if MCP is enabled
    const mcpEnabled = store.get('mcpEnabled')
    if (mcpEnabled !== 'true') {
      console.log('[MCP] MCP is not enabled, skipping auto-connect')
      return
    }

    // Get MCP configuration
    const mcpConfigStr = store.get('mcpConfig')
    if (!mcpConfigStr) {
      console.log('[MCP] No MCP configuration found, skipping auto-connect')
      return
    }

    let mcpConfig
    try {
      mcpConfig = JSON.parse(mcpConfigStr)
    } catch (err) {
      console.error('[MCP] Failed to parse MCP configuration:', err)
      return
    }

    if (!mcpConfig.mcpServers) {
      console.log('[MCP] No MCP servers configured, skipping auto-connect')
      return
    }

    // Connect to all enabled servers
    for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
      const serverEnabled = store.get(`mcpServerEnabled:${serverName}`)
      if (serverEnabled === 'true') {
        await autoConnectToServer(serverName, serverConfig as MCPServer)
      }
    }

    console.log(`[MCP] Auto-connected to ${activeClients.size} MCP servers`)
  } catch (error) {
    console.error('[MCP] Error during MCP auto-connect:', error)
  }
}

/**
 * Automatically connect to a specific MCP server
 *
 * @param serverName Server name
 * @param serverConfig Server configuration (optional)
 */
async function autoConnectToServer(serverName: string, serverConfig?: MCPServer): Promise<boolean> {
  console.log(`[MCP] Auto-connecting to MCP server: ${serverName}`)

  try {
    // If server configuration is not provided, get it from storage
    if (!serverConfig) {
      const Store = require('electron-store')
      const store = new Store()

      const mcpConfigStr = store.get('mcpConfig')
      if (!mcpConfigStr) {
        return false
      }

      try {
        const mcpConfig = JSON.parse(mcpConfigStr)
        serverConfig = mcpConfig.mcpServers[serverName] as MCPServer

        if (!serverConfig) {
          console.error(`[MCP] Server configuration for ${serverName} not found`)
          return false
        }
      } catch (err) {
        console.error('[MCP] Failed to parse MCP configuration:', err)
        return false
      }
    }

    // Check if connection already exists
    if (activeClients.has(serverName)) {
      const existingClient = activeClients.get(serverName)
      if (existingClient && existingClient.isConnected()) {
        console.log(`[MCP] Server ${serverName} is already connected`)
        return true
      }

      // If exists but disconnected, clean up first
      if (existingClient) {
        try {
          await existingClient.disconnect()
        } catch (err) {
          console.error(`[MCP] Error disconnecting existing client for ${serverName}:`, err)
        }
        activeClients.delete(serverName)
      }
    }

    // Create and connect new client
    const client = new MCPClient()
    const connected = await client.connectToServer(serverConfig)

    if (connected) {
      const tools = client.getTools()
      console.log(`Successfully connected to MCP server: ${serverName}`)
      console.log(`Available tools: ${tools.map((t: any) => t.name).join(', ')}`)

      activeClients.set(serverName, client)
      return true
    } else {
      console.error(`[MCP] Failed to connect to MCP server: ${serverName}`)
      return false
    }
  } catch (error) {
    console.error(`[MCP] Error auto-connecting to MCP server ${serverName}:`, error)
    return false
  }
}

/**
 * Clean up all active connections
 */
export async function cleanupMCPConnections(): Promise<void> {
  console.log(`[MCP] Cleaning up ${activeClients.size} MCP connections`)

  for (const [name, client] of activeClients.entries()) {
    try {
      await client.disconnect()
      console.log(`[MCP] Disconnected from MCP server: ${name}`)
    } catch (error) {
      console.error(`[MCP] Error disconnecting from MCP server: ${name}`, error)
    }
  }

  activeClients.clear()
}
