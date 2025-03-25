import { streamText } from 'ai'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY, getCopilotMessageId } from '@/utils/idGenerator'
import { getModelProvider, isReasoningModel } from '@/utils/ai/copilot'
import { processMCPCalls } from '@/utils/ai/mcp/MCPUtils'
import { AIStreamOptions, CopilotMessage, CopilotRole, StreamError, ChatLoopOptions } from '@/types/copilot'
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
  public onStreamChunk: ((text: string) => void) | null = null
  public onStreamStart: (() => void) | null = null
  public onError: ((error: unknown) => void) | null = null
  public onComplete: ((responseMessage: CopilotMessage) => void) | null = null
  public onAbort: (() => void) | null = null
  public onReasoningChunk: ((reasoning: string) => void) | null = null

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
    onReasoningChunk?: (reasoning: string) => void
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
    this.onReasoningChunk = options.onReasoningChunk || null
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
   * Process reasoning content chunks from the large language model
   * @param textDelta New reasoning text to be added
   * @param reasoningBuffer Current accumulated reasoning content
   */
  private handleReasoningChunk(textDelta: string, reasoningBuffer: string): string {
    if (reasoningBuffer.length === 0 && this.onStreamStart) {
      this.onStreamStart()
    }

    const updatedBuffer = reasoningBuffer + textDelta

    if (this.onReasoningChunk) {
      this.onReasoningChunk(updatedBuffer)
    }

    return updatedBuffer
  }

  /**
   * Create a text stream, this method can be called separately to get the textStream
   *
   * @param messageHistory Array of message objects representing the message history
   * @param options Optional configuration options
   * @returns textStream object
   */
  public chatWithStream(messageHistory: Array<{ role: CopilotRole; content: string }>, options?: AIStreamOptions) {
    const apiKey = this.decryptAPIKey()
    this.abortController = new AbortController()

    const supportsReasoning = isReasoningModel(this.model)
    let reasoningBuffer = ''

    const result = streamText({
      model: getModelProvider({
        model: this.model,
        baseURL: this.openAIAPIHost,
        apiKey,
      }),
      messages: messageHistory,
      abortSignal: this.abortController.signal,
      onError: this.handleStreamError,
      temperature: options?.temperature ?? 0.5,
      maxTokens: options?.maxTokens,
      topP: options?.topP,
      frequencyPenalty: options?.frequencyPenalty,
      presencePenalty: options?.presencePenalty,
      onChunk: supportsReasoning
        ? ({ chunk }) => {
            if (chunk.type === 'reasoning') {
              reasoningBuffer = this.handleReasoningChunk(chunk.textDelta, reasoningBuffer)
            }
          }
        : undefined,
    })

    return result
  }

  /**
   * Generate AI response using streaming
   *
   * @param messageHistory Message history to send to the LLM
   */
  public async generateResponse(
    messageHistory: Array<{ role: CopilotRole; content: string }>,
    options?: AIStreamOptions,
  ): Promise<CopilotMessage> {
    let responseText = ''
    let isFirstChunk = true

    const responseMessage: CopilotMessage = {
      id: getCopilotMessageId(),
      role: 'assistant',
      content: '',
    }

    try {
      const { textStream, reasoning } = this.chatWithStream(messageHistory, options)

      for await (const textPart of textStream) {
        responseText += textPart

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

      if (reasoning && isReasoningModel(this.model)) {
        const finalReason = await reasoning
        responseMessage.reasoning = finalReason
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

  /**
   * Chat in multiple turns within the same message
   *
   * @param initialHistory Initial message history (directly used without modifications)
   * @param options Chat loop configuration options
   */
  public async chatLoop(
    initialHistory: Array<{ role: CopilotRole; content: string }>,
    options: ChatLoopOptions,
  ): Promise<CopilotMessage> {
    const {
      shouldContinue,
      updateCallback,
      formatAppend = (current: string, next: string) => `${current}\n\n${next}`,
      stopCondition,
      maxTurns = 3,
      streamOptions,
      existingMessage,
    } = options

    // Initialize state with existing message
    const responseMessage: CopilotMessage = { ...existingMessage }
    let currentContent = existingMessage.content
    let lastContent = ''
    let turns = 0

    // Main conversation loop
    while (turns < maxTurns && shouldContinue(currentContent)) {
      // Check stop condition
      if (stopCondition && stopCondition(currentContent)) {
        break
      }

      // Safety check: exit if content hasn't changed
      if (lastContent === currentContent && turns > 0) {
        break
      }

      lastContent = currentContent
      turns++

      let responseText = ''

      try {
        // Send request with provided initial history
        const { textStream } = this.chatWithStream(initialHistory, streamOptions)

        // Process streaming response
        for await (const textPart of textStream) {
          responseText += textPart
          if (this.onStreamChunk) {
            this.onStreamChunk(responseText)
          }
        }

        // Process MCP calls and update content
        if (this.mcpAvailable) {
          responseText = await processMCPCalls(responseText)
        }

        // Merge new content and update message
        currentContent = formatAppend(currentContent, responseText)
        responseMessage.content = currentContent

        // Call update callback
        await updateCallback(responseMessage)

        // Check stop condition again
        if (stopCondition && stopCondition(currentContent)) {
          break
        }
      } catch (error) {
        // Handle aborts and errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (this.onAbort) this.onAbort()
        } else if (this.onError) {
          this.onError(error)
        }
        break
      } finally {
        // Reset abort controller
        this.abortController = null
      }
    }

    return responseMessage
  }
}
