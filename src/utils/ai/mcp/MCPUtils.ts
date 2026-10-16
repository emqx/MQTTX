import { EnabledMCPServer, ToolCallResult } from '@/types/mcp'
import { ipcRenderer } from 'electron'
import { dynamicTool, jsonSchema, ToolSet } from 'ai'

/**
 * Call MCP tool via IPC to main process
 * @param serverName Server name
 * @param toolName Tool name
 * @param toolArgs Tool arguments
 * @returns Tool call result
 */
export async function callMCPTool(serverName: string, toolName: string, toolArgs: any) {
  try {
    const result = await ipcRenderer.invoke('mcp:call-tool', serverName, toolName, toolArgs)
    return result
  } catch (error) {
    console.error(`[MCP] Error calling tool ${toolName} on server ${serverName}:`, error)
    throw error
  }
}

/**
 * Builds a tool name accepted by every provider (letters, digits, `_` and `-`, at most 64 characters)
 */
export const getMCPToolName = (serverName: string, toolName: string): string =>
  `${serverName}__${toolName}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)

/**
 * Flattens MCP content blocks into text for the model and the tool card
 */
const getMCPContentText = (content: ToolCallResult['content']): string =>
  Array.isArray(content)
    ? content.map((block) => (block.type === 'text' ? block.text : JSON.stringify(block))).join('\n')
    : String(content ?? '')

/**
 * Loads the tools of the enabled MCP servers as agent tools
 * @returns Tools keyed by a provider-safe name; empty when MCP is disabled or unavailable
 */
export async function loadMCPTools(): Promise<ToolSet> {
  const tools: ToolSet = {}
  try {
    const servers: EnabledMCPServer[] = await ipcRenderer.invoke('mcp:list-tools')
    for (const server of servers) {
      for (const mcpTool of server.tools) {
        tools[getMCPToolName(server.name, mcpTool.name)] = dynamicTool({
          title: `${server.name} - ${mcpTool.name}`,
          description: mcpTool.description,
          inputSchema: jsonSchema(mcpTool.input_schema),
          execute: async (input) => {
            const response = await callMCPTool(server.name, mcpTool.name, input)
            if (!response.success) {
              throw new Error(response.message || 'Unknown error')
            }
            const result: ToolCallResult = response.result
            if (result.error) {
              throw new Error(result.error)
            }
            const text = getMCPContentText(result.content)
            if (result.isError) {
              throw new Error(text)
            }
            return text
          },
        })
      }
    }
  } catch (error) {
    console.error('[MCP] Error loading MCP tools:', error)
  }
  return tools
}
