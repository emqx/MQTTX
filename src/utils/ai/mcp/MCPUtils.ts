import { MCPConfig, MCPPromptData, EnabledMCPServer } from '@/types/mcp'
import { ipcRenderer } from 'electron'

// MCP tool call format regex
export const MCP_CALL_REGEX = /<mcp-call>([\s\S]*?)<\/mcp-call>/g

/**
 * Load enabled MCP servers from Electron Store
 * @returns An object containing MCP server information for prompt templates
 */
export async function loadEnabledMCPServers(): Promise<MCPPromptData> {
  const defaultResult: MCPPromptData = {
    serversSection: '',
    toolsSection: '',
    hasMCP: false,
  }

  try {
    const mcpEnabled = await ipcRenderer.invoke('mcp:get-enabled')
    if (!mcpEnabled) {
      return defaultResult
    }

    // Retrieve MCP configuration
    const mcpConfig: MCPConfig = await ipcRenderer.invoke('mcp:get-config')
    if (!mcpConfig.mcpServers || Object.keys(mcpConfig.mcpServers).length === 0) {
      return defaultResult
    }

    // Get list of enabled servers
    const enabledServersData = (await ipcRenderer.invoke('mcp:get-enabled-servers')) as Record<
      string,
      {
        enabled: boolean
        testResults: {
          success: boolean
          tools?: Array<{
            name: string
            description: string
            input_schema: any
          }>
        } | null
      }
    >
    const enabledServers: EnabledMCPServer[] = []

    for (const [serverName, serverData] of Object.entries(enabledServersData)) {
      if (
        !serverData.enabled ||
        !serverData.testResults ||
        !serverData.testResults.success ||
        !serverData.testResults.tools ||
        serverData.testResults.tools.length === 0
      ) {
        continue
      }
      enabledServers.push({
        name: serverName,
        tools: serverData.testResults.tools,
      })
    }

    if (enabledServers.length === 0) {
      return defaultResult
    }

    return {
      serversSection: JSON.stringify(enabledServers.map((server) => server.name)),
      toolsSection: JSON.stringify(enabledServers),
      hasMCP: true,
    }
  } catch (error) {
    console.error('[MCP] Error loading enabled MCP servers:', error)
    return defaultResult
  }
}

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
 * Process MCP tool calls in a message
 * @param content Message content to process
 * @returns Processed content with tool call results
 */
export async function processMCPCalls(content: string): Promise<string> {
  // If no MCP calls, return content as is
  if (!content.includes('<mcp-call>')) {
    return content
  }

  let processedContent = content
  const mcpCalls = content.match(MCP_CALL_REGEX)

  if (mcpCalls) {
    for (const mcpCall of mcpCalls) {
      try {
        // Extract the JSON part from the MCP call
        const jsonContent = mcpCall.replace('<mcp-call>', '').replace('</mcp-call>', '').trim()
        const callData = JSON.parse(jsonContent)

        // Call the MCP tool
        const result = await callMCPTool(callData.server, callData.tool, callData.args)
        console.log('[MCP] Tool call result:', result)
        // Format the result
        let resultContent = ''
        if (result.success) {
          resultContent = `
<mcp-result success="true">
<server>${callData.server}</server>
<tool>${callData.tool}</tool>
<args>${JSON.stringify(callData.args)}</args>
<result>
${getMCPResult(result)}
</result>
</mcp-result>
`
        } else {
          resultContent = `
<mcp-result success="false">
<server>${callData.server}</server>
<tool>${callData.tool}</tool>
<args>${JSON.stringify(callData.args)}</args>
<error>
${result.message || 'Unknown error'}
</error>
</mcp-result>
`
        }

        // Replace the MCP call with the result
        processedContent = processedContent.replace(mcpCall, resultContent)
      } catch (error) {
        console.error('[MCP] Error processing MCP call:', error)
        const errorMessage = `
<mcp-result success="false">
<error>
Failed to process MCP call: ${error instanceof Error ? error.message : String(error)}
</error>
</mcp-result>
`
        processedContent = processedContent.replace(mcpCall, errorMessage)
      }
    }
  }

  return processedContent
}

/**
 * Extracts the result content from an MCP tool call response.
 *
 * @param result - The result object from an MCP tool call
 * @param result.success - Whether the MCP tool call was successful
 * @param result.result - The result data from the MCP tool call
 * @param result.result.content - Array of content objects if successful
 * @param result.result.error - Error message if there was an error
 * @returns A string representation of the result content or error message
 */
const getMCPResult = (result: {
  success: boolean
  result: { content: { text: string }[]; error?: string }
}): string => {
  if (result.result.error) {
    return result.result.error
  }
  return JSON.stringify(result.result.content[0].text)
}
