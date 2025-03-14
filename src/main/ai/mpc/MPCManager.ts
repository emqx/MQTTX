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
    console.log(`Testing connection to MCP server: ${serverName}`)
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
    console.log(`Calling tool ${toolName} on server ${serverName}`)

    try {
      const client = activeClients.get(serverName)
      if (!client) {
        throw new Error(`No active connection to server: ${serverName}`)
      }

      if (!client.isConnected()) {
        throw new Error(`Connection to server ${serverName} has been lost`)
      }

      const result = await client.callTool(toolName, toolArgs)
      return {
        success: true,
        result,
      }
    } catch (error) {
      console.error(`Error calling tool ${toolName} on server ${serverName}:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // Disconnect from a server
  ipcMain.handle('mcp:disconnect', async (_, serverName: string) => {
    console.log(`Disconnecting from MCP server: ${serverName}`)

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
      console.error(`Error disconnecting from MCP server: ${serverName}`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  })
}

/**
 * Clean up all active connections
 */
export async function cleanupMCPConnections(): Promise<void> {
  console.log(`Cleaning up ${activeClients.size} MCP connections`)

  for (const [name, client] of activeClients.entries()) {
    try {
      await client.disconnect()
      console.log(`Disconnected from MCP server: ${name}`)
    } catch (error) {
      console.error(`Error disconnecting from MCP server: ${name}`, error)
    }
  }

  activeClients.clear()
}
