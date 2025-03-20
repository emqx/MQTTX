import { streamText } from 'ai'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY, getCopilotMessageId } from '@/utils/idGenerator'
import { getModelProvider } from '@/utils/ai/copilot'
import { processMCPCalls } from '@/utils/ai/mcp/MCPUtils'
import { CopilotMessage, CopilotRole, StreamError } from '@/types/copilot'
import { SessionManager } from '@/utils/ai/SessionManager'

/**
 * AIAgent - Handles interactions with LLMs
 *
 * This class encapsulates the logic for communicating with AI models,
 * processing responses, and handling streaming.
 */
export class AIAgent {
  private openAIAPIHost: string
  private openAIAPIKey: string
  private model: App['model']
  private currentLang: Language
  private sessionManager: SessionManager
  private abortController: AbortController | null = null
  private mcpAvailable = false

  // Callback handlers
  private onStreamChunk: ((text: string) => void) | null = null
  private onStreamStart: (() => void) | null = null
  private onError: ((error: unknown) => void) | null = null
  private onComplete: ((responseMessage: CopilotMessage) => void) | null = null
  private onAbort: (() => void) | null = null

  /**
   * Constructor for AIAgent
   *
   * @param options Configuration options for the agent
   */
  constructor(options: {
    openAIAPIHost: string
    openAIAPIKey: string
    model: App['model']
    currentLang: Language
    sessionManager: SessionManager
    onStreamChunk?: (text: string) => void
    onStreamStart?: () => void
    onError?: (error: unknown) => void
    onComplete?: (responseMessage: CopilotMessage) => void
    onAbort?: () => void
  }) {
    this.openAIAPIHost = options.openAIAPIHost
    this.openAIAPIKey = options.openAIAPIKey
    this.model = options.model
    this.currentLang = options.currentLang
    this.sessionManager = options.sessionManager
    this.onStreamChunk = options.onStreamChunk || null
    this.onStreamStart = options.onStreamStart || null
    this.onError = options.onError || null
    this.onComplete = options.onComplete || null
    this.onAbort = options.onAbort || null
  }

  /**
   * Check if MCP is available for use
   */
  public async checkMCPAvailability(): Promise<boolean> {
    await this.sessionManager.loadMCPData()
    this.mcpAvailable = this.sessionManager.getState().mcpData?.hasMCP === true
    return this.mcpAvailable
  }

  /**
   * Abort the current stream if one is in progress
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
      if (this.onAbort) {
        this.onAbort()
      }
    }
  }

  /**
   * Handle stream error events
   */
  private handleStreamError = ({ error }: StreamError): void => {
    if (this.onError) {
      this.onError(error)
    }
  }

  /**
   * Decrypt API key
   */
  private decryptAPIKey(): string {
    const bytes = CryptoJS.AES.decrypt(this.openAIAPIKey, ENCRYPT_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  /**
   * Build message history for the AI query
   *
   * @param messages Array of message objects
   * @param getConnectionRecord Function to get current connection record
   */
  public async buildMessageHistory(
    messages: CopilotMessage[],
    getConnectionRecord?: () => any | undefined,
  ): Promise<Array<{ role: CopilotRole; content: string }>> {
    const systemPrompt = await this.sessionManager.getSystemPrompt(this.currentLang)

    return [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages.slice(-20).map(({ role, content }) => {
        if (content.includes('@connection') && getConnectionRecord) {
          const currentRecord = getConnectionRecord()
          content = content.replace(
            '@connection',
            currentRecord ? JSON.stringify(currentRecord) : 'No connection available',
          )
        }
        return { role, content }
      }),
    ]
  }

  /**
   * Generate AI response using streaming
   *
   * @param messageHistory Message history to send to the LLM
   */
  public async generateResponse(
    messageHistory: Array<{ role: CopilotRole; content: string }>,
  ): Promise<CopilotMessage> {
    const apiKey = this.decryptAPIKey()
    let responseText = ''
    let isFirstChunk = true

    const responseMessage: CopilotMessage = {
      id: getCopilotMessageId(), // This will be replaced by the actual ID in Copilot component
      role: 'assistant',
      content: '',
    }

    try {
      this.abortController = new AbortController()

      const { textStream } = streamText({
        model: getModelProvider({
          model: this.model,
          baseURL: this.openAIAPIHost,
          apiKey,
        }),
        temperature: 0.5,
        messages: messageHistory,
        abortSignal: this.abortController.signal,
        onError: this.handleStreamError,
      })

      for await (const textPart of textStream) {
        responseText += textPart

        // 在第一个文本块接收时触发开始回调
        if (isFirstChunk) {
          isFirstChunk = false
          if (this.onStreamStart) {
            this.onStreamStart()
          }
        }

        if (this.onStreamChunk) {
          this.onStreamChunk(responseText)
        }
      }

      // Process MCP calls if available
      if (this.mcpAvailable) {
        const processedContent = await processMCPCalls(responseText)
        responseMessage.content = processedContent
      } else {
        responseMessage.content = responseText
      }

      if (this.onComplete) {
        this.onComplete(responseMessage)
      }

      return responseMessage
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Handle abort silently
        if (this.onAbort) {
          this.onAbort()
        }
      } else if (this.onError) {
        this.onError(error)
      }

      responseMessage.content = responseText
      return responseMessage
    } finally {
      this.abortController = null
    }
  }
}
