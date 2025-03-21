import { MCPConfig, MCPPromptData, EnabledMCPServer } from '@/types/mcp'
import { ipcRenderer } from 'electron'
import { getCopilotMessageId } from '@/utils/idGenerator'
import mcpResultAnalysis from '@/utils/ai/prompts/mcpResultAnalysis.txt'
import { LANGUAGE_MAP } from '@/utils/ai/copilot'

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
 * Creates a formatted MCP result string
 * @param success Whether the operation was successful
 * @param server Server name
 * @param tool Tool name
 * @param args Tool arguments
 * @param content Result content or error message
 * @returns Formatted MCP result string
 */
function createMCPResultString(success: boolean, server: string, tool: string, args: any, content: string): string {
  const contentTag = success ? 'result' : 'error'

  return `
<mcp-result success="${success}">
<server>${server}</server>
<tool>${tool}</tool>
<args>${JSON.stringify(args, null, 2)}</args>
<${contentTag}>
${content}
</${contentTag}>
</mcp-result>
`
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

  if (!mcpCalls) {
    return content
  }

  for (const mcpCall of mcpCalls) {
    let resultContent: string

    try {
      // Extract the JSON part from the MCP call
      const jsonContent = mcpCall.replace('<mcp-call>', '').replace('</mcp-call>', '').trim()
      const callData = JSON.parse(jsonContent)

      // Call the MCP tool
      const result = await callMCPTool(callData.server, callData.tool, callData.args)

      if (result.success) {
        resultContent = createMCPResultString(true, callData.server, callData.tool, callData.args, getMCPResult(result))
      } else {
        resultContent = createMCPResultString(
          false,
          callData.server,
          callData.tool,
          callData.args,
          result.message || 'Unknown error',
        )
      }
    } catch (error) {
      console.error('[MCP] Error processing MCP call:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      resultContent = createMCPResultString(false, '', '', {}, `Failed to process MCP call: ${errorMessage}`)
    }

    // Replace the MCP call with the result
    processedContent = processedContent.replace(mcpCall, resultContent)
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

export const buildMCPAnalysisMessages = (
  currentLang: Language,
  assistantContent: string,
  userPrompt: string,
): CopilotMessage[] => {
  const systemPrompt = `${mcpResultAnalysis}\n\n${LANGUAGE_MAP[currentLang]}`
  return [
    { id: getCopilotMessageId(), role: 'system', content: systemPrompt },
    { id: getCopilotMessageId(), role: 'assistant', content: assistantContent },
    { id: getCopilotMessageId(), role: 'user', content: userPrompt },
  ]
}

/**
 * Returns the conditions for determining when to continue or stop MCP analysis.
 *
 * @returns An object containing two functions:
 *   - shouldContinue: Function that returns true if analysis should continue
 *   - stopCondition: Function that returns true if analysis should stop
 */
export const getMCPAnalysisConditions = () => {
  const COMPLETION_MARKERS = ['[DONE]']

  const shouldContinue = (content: string) =>
    content.includes('mcp-result') && !COMPLETION_MARKERS.some((marker) => content.includes(marker))

  const stopCondition = (content: string) =>
    COMPLETION_MARKERS.some((marker) => content.includes(marker)) || !shouldContinue(content)

  return {
    shouldContinue,
    stopCondition,
  }
}
