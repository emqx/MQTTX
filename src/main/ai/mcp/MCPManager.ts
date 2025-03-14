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
        // 如果服务器未连接，尝试自动连接
        await autoConnectToServer(serverName)
        const reconnectedClient = activeClients.get(serverName)
        if (!reconnectedClient) {
          throw new Error(`No active connection to server: ${serverName} and auto-reconnect failed`)
        }

        const result = await reconnectedClient.callTool(toolName, toolArgs)
        return {
          success: true,
          result,
        }
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

  // 自动连接已启用的 MCP 服务器
  autoConnectToEnabledServers()
}

/**
 * 自动连接到启用的 MCP 服务器
 */
async function autoConnectToEnabledServers(): Promise<void> {
  console.log('Checking for enabled MCP servers to auto-connect')

  try {
    // 从本地存储中读取 MCP 配置
    const Store = require('electron-store')
    const store = new Store()

    // 检查 MCP 是否启用
    const mcpEnabled = store.get('mcpEnabled')
    if (mcpEnabled !== 'true') {
      console.log('MCP is not enabled, skipping auto-connect')
      return
    }

    // 获取 MCP 配置
    const mcpConfigStr = store.get('mcpConfig')
    if (!mcpConfigStr) {
      console.log('No MCP configuration found, skipping auto-connect')
      return
    }

    let mcpConfig
    try {
      mcpConfig = JSON.parse(mcpConfigStr)
    } catch (err) {
      console.error('Failed to parse MCP configuration:', err)
      return
    }

    if (!mcpConfig.mcpServers) {
      console.log('No MCP servers configured, skipping auto-connect')
      return
    }

    // 连接所有启用的服务器
    for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
      const serverEnabled = store.get(`mcpServerEnabled:${serverName}`)
      if (serverEnabled === 'true') {
        await autoConnectToServer(serverName, serverConfig as MCPServer)
      }
    }

    console.log(`Auto-connected to ${activeClients.size} MCP servers`)
  } catch (error) {
    console.error('Error during MCP auto-connect:', error)
  }
}

/**
 * 自动连接到指定的 MCP 服务器
 *
 * @param serverName 服务器名称
 * @param serverConfig 服务器配置（可选）
 */
async function autoConnectToServer(serverName: string, serverConfig?: MCPServer): Promise<boolean> {
  console.log(`Auto-connecting to MCP server: ${serverName}`)

  try {
    // 如果没有提供服务器配置，从存储中获取
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
          console.error(`Server configuration for ${serverName} not found`)
          return false
        }
      } catch (err) {
        console.error('Failed to parse MCP configuration:', err)
        return false
      }
    }

    // 检查是否已经有连接
    if (activeClients.has(serverName)) {
      const existingClient = activeClients.get(serverName)
      if (existingClient && existingClient.isConnected()) {
        console.log(`Server ${serverName} is already connected`)
        return true
      }

      // 如果存在但断开连接，先清理
      if (existingClient) {
        try {
          await existingClient.disconnect()
        } catch (err) {
          console.error(`Error disconnecting existing client for ${serverName}:`, err)
        }
        activeClients.delete(serverName)
      }
    }

    // 创建并连接新客户端
    const client = new MCPClient()
    const connected = await client.connectToServer(serverConfig)

    if (connected) {
      const tools = client.getTools()
      console.log(`Successfully connected to MCP server: ${serverName}`)
      console.log(`Available tools: ${tools.map((t: any) => t.name).join(', ')}`)

      activeClients.set(serverName, client)
      return true
    } else {
      console.error(`Failed to connect to MCP server: ${serverName}`)
      return false
    }
  } catch (error) {
    console.error(`Error auto-connecting to MCP server ${serverName}:`, error)
    return false
  }
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
