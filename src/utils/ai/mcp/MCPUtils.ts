import { MCPConfig, MCPPromptData, EnabledMCPServer } from '@/types/mcp'
import { ipcRenderer } from 'electron'

// MCP tool call format regex
export const MCP_CALL_REGEX = /<mcp-call>([\s\S]*?)<\/mcp-call>/g

/**
 * Load enabled MCP servers from local storage
 * @returns Object containing MCP servers info for prompt template
 */
export async function loadEnabledMCPServers(): Promise<MCPPromptData> {
  const defaultResult: MCPPromptData = {
    serversSection: '',
    toolsSection: '',
    hasMCP: false,
  }

  // Check if MCP is globally enabled
  const mcpEnabled = localStorage.getItem('mcpEnabled') === 'true'
  if (!mcpEnabled) {
    return defaultResult
  }

  try {
    // Load MCP configuration from local storage
    const storedConfig = localStorage.getItem('mcpConfig')
    if (!storedConfig) {
      return defaultResult
    }

    const mcpConfig: MCPConfig = JSON.parse(storedConfig)
    if (!mcpConfig.mcpServers || Object.keys(mcpConfig.mcpServers).length === 0) {
      return defaultResult
    }

    // Get enabled servers
    const enabledServers: EnabledMCPServer[] = []

    for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
      const isEnabled = localStorage.getItem(`mcpServerEnabled:${serverName}`) === 'true'
      if (!isEnabled) {
        continue
      }

      const serverResult = localStorage.getItem(`mcpServerResult:${serverName}`)
      if (!serverResult) {
        continue
      }

      const parsedResult = JSON.parse(serverResult)
      if (!parsedResult.success || !parsedResult.tools || parsedResult.tools.length === 0) {
        continue
      }

      enabledServers.push({
        name: serverName,
        tools: parsedResult.tools,
      })
    }

    if (enabledServers.length === 0) {
      return defaultResult
    }

    // Format servers section
    const serversSection = enabledServers.map((server) => `- ${server.name}`).join('\n')

    // Format tools section
    const toolsSection = enabledServers
      .map((server) => {
        const toolsList = server.tools.map((tool) => `  - ${tool.name}: ${tool.description}`).join('\n')

        return `- ${server.name}:\n${toolsList}`
      })
      .join('\n\n')

    return {
      serversSection,
      toolsSection,
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
${JSON.stringify(result.result.content[0].text)}
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
