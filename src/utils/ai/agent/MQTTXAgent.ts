import { ToolLoopAgent, stepCountIs, ToolSet } from 'ai'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY, getAgentMessageId } from '@/utils/idGenerator'
import {
  getModelProvider,
  AImodelsOptions,
  AIAPIHostOptions,
  loadSystemPrompt,
  supportsReasoning,
  getReasoningEfforts,
} from '@/utils/ai/models'
import { buildReasoningCallOptions } from '@/utils/ai/reasoning'
import type { AgentReasoning } from '@/utils/ai/reasoning'
import { loadMCPTools } from '@/utils/ai/mcp/MCPUtils'
import {
  applyStreamPart,
  appendStepLimit,
  getPartsText,
  setToolState,
  stopParts,
  approveToolPart,
  toModelMessages,
} from '@/utils/ai/agent/messageParts'
import { AgentMessage, AIModel } from '@/types/agent'
import { ApprovalGate, PermissionMode, withApproval } from '@/utils/ai/agent/approval'
import { AgentToolDeps } from '@/utils/ai/agent/tools/types'
import { AGENT_ALWAYS_ASK_TOOLS, AGENT_WRITE_TOOLS, createMQTTTools } from '@/utils/ai/agent/tools'
import { buildAppContext, renderAppContext } from '@/utils/ai/agent/tools/appContext'

const normalizeHost = (url?: string): string => (url ? url.toLowerCase().replace(/\/+$/, '') : '')

/** Known non-Azure hosts, matched by a fragment of the option value, normalized once */
const PROVIDER_HOSTS: Array<[string, typeof AImodelsOptions[number]['value']]> = (
  [
    ['google', 'Google'],
    ['anthropic', 'Anthropic'],
    ['deepseek', 'DeepSeek'],
    ['x.ai', 'xAI'],
    ['siliconflow', 'SiliconFlow'],
    ['dashscope', 'Alibaba'],
    ['mistral.ai', 'Mistral'],
    ['groq.com', 'Groq'],
    ['cohere.com', 'Cohere'],
    ['together.xyz', 'Together AI'],
    ['fireworks.ai', 'Fireworks'],
    ['deepinfra.com', 'DeepInfra'],
    ['cerebras.ai', 'Cerebras'],
    ['moonshot.ai', 'Moonshot AI'],
    ['minimax.io', 'MiniMax'],
    ['z.ai', 'Z.AI'],
    ['perplexity.ai', 'Perplexity'],
    ['ai-gateway.vercel.sh', 'Vercel AI Gateway'],
  ] as const
).map(([fragment, provider]) => [
  normalizeHost(AIAPIHostOptions.find((option) => option.value.includes(fragment))?.value),
  provider,
])

/**
 * MQTTXAgent - Handles interactions with LLMs
 *
 * This class runs the MQTTX Agent: it calls the model, executes the tools the model asks for,
 * feeds the results back and streams every step of the reply.
 */
export class MQTTXAgent {
  private openAIAPIHost: string
  private openAIAPIKey: string
  private model: App['model']
  private currentLang: Language
  private deps: AgentToolDeps
  private gate: ApprovalGate
  private allowedTools: Set<string>
  private maxSteps: number
  private reasoning: AgentReasoning
  private abortController: AbortController | null = null

  // Callback handlers
  public onStreamStart: (() => void) | null = null
  public onUpdate: ((responseMessage: AgentMessage) => void) | null = null
  public onError: ((error: unknown, partialMessage: AgentMessage) => void) | null = null
  public onComplete: ((responseMessage: AgentMessage) => void) | null = null
  public onAbort: ((responseMessage: AgentMessage) => void) | null = null

  /**
   * Constructor for MQTTXAgent
   *
   * @param options Configuration options for the agent
   */
  constructor(options: {
    openAIAPIHost: string
    openAIAPIKey: string
    model: App['model']
    currentLang: Language
    deps: AgentToolDeps
    gate: ApprovalGate
    allowedTools: Set<string>
    maxSteps: number
    reasoning: AgentReasoning
    onStreamStart?: () => void
    onUpdate?: (responseMessage: AgentMessage) => void
    onError?: (error: unknown, partialMessage: AgentMessage) => void
    onComplete?: (responseMessage: AgentMessage) => void
    onAbort?: (responseMessage: AgentMessage) => void
  }) {
    this.openAIAPIHost = options.openAIAPIHost
    this.openAIAPIKey = options.openAIAPIKey
    this.model = options.model
    this.currentLang = options.currentLang
    this.deps = options.deps
    this.gate = options.gate
    this.allowedTools = options.allowedTools
    this.maxSteps = options.maxSteps
    this.reasoning = options.reasoning
    this.onStreamStart = options.onStreamStart || null
    this.onUpdate = options.onUpdate || null
    this.onError = options.onError || null
    this.onComplete = options.onComplete || null
    this.onAbort = options.onAbort || null
  }

  /**
   * Abort the current stream if one is in progress
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
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
   * Build the model messages for the agent from the conversation
   *
   * @param messages Array of message objects
   * @param getConnectionRecord Function to get current connection record
   */
  private buildMessageHistory(messages: AgentMessage[], getConnectionRecord?: () => any | undefined) {
    return toModelMessages(
      messages.slice(-20).map((message) => {
        if (message.content.includes('@connection') && getConnectionRecord) {
          const currentRecord = getConnectionRecord()
          const content = message.content.replace(
            '@connection',
            currentRecord ? JSON.stringify(currentRecord) : 'No connection available',
          )
          return { ...message, content }
        }
        return message
      }),
    )
  }

  /**
   * Process the AI model to extract model information
   *
   * @param model The AI model identifier
   * @returns Object containing the actual model name and provider-specific flags
   */
  private processModel(model: AIModel): {
    actualModel: AIModel
    isAzure: boolean
  } {
    let actualModel = model

    // Check if this is an Azure deployment
    const isAzure = actualModel.includes('deployment-')

    // Remove the deployment prefix for Azure models
    if (isAzure) {
      actualModel = actualModel.replace('deployment-', '') as AIModel
    }

    return {
      actualModel,
      isAzure,
    }
  }

  /**
   * Determines the AI provider type based on the model name and API host.
   *
   * Strategy:
   * 1. First checks if the model is an Azure deployment based on the isAzure flag.
   * 2. If not Azure, attempts to match the model name against known models in AImodelsOptions.
   * 3. If no model match is found, tries to identify the provider by matching the host URL
   *    against known API endpoints from AIAPIHostOptions.
   * 4. Falls back to OpenAI if no other provider can be determined.
   *
   * @param model - The AI model identifier (base model name or deployment name)
   * @param host - The API host URL
   * @param isAzure - Optional flag indicating if this is an Azure deployment
   * @returns The provider type ('Azure OpenAI', 'OpenAI', 'Google', 'Anthropic', 'DeepSeek', 'xAI', 'SiliconFlow')
   */
  private determineProviderType(
    model: AIModel,
    host: string,
    isAzure?: boolean,
  ): typeof AImodelsOptions[number]['value'] {
    // **Priority 1: Check for Azure host pattern**
    if (isAzure) {
      return 'Azure OpenAI'
    }

    // **Priority 2: Check if the model name matches a known model for a specific provider**
    for (const provider of AImodelsOptions) {
      if (provider.children.some((child) => child.value === model)) {
        return provider.value
      }
    }

    // **Priority 3: Infer provider based on known non-Azure host URLs**
    const normalizedHost = normalizeHost(host)
    if (normalizedHost) {
      for (const [knownHost, provider] of PROVIDER_HOSTS) {
        if (normalizedHost === knownHost) return provider
      }
    }

    // Fallback: Default to OpenAI
    console.warn(
      `Could not definitively determine provider type for model '${model}' and host '${host}'. Defaulting to OpenAI.`,
    )
    return 'OpenAI'
  }

  /**
   * Create the agent for one reply with the current model, instructions and tools
   *
   * @param instructions System prompt of the session
   * @param tools Tools the model can call
   */
  private createAgent(instructions: string, tools: ToolSet) {
    const { actualModel, isAzure } = this.processModel(this.model)

    const providerType = this.determineProviderType(actualModel, this.openAIAPIHost, isAzure)

    // The strength is one unified AI SDK option; each provider package maps it to its own field
    const reasoningOptions = buildReasoningCallOptions({
      reasoning: this.reasoning,
      provider: providerType,
      modelSupportsReasoning: supportsReasoning(actualModel),
      efforts: getReasoningEfforts(actualModel),
    })

    return new ToolLoopAgent({
      model: getModelProvider({
        model: actualModel,
        baseURL: this.openAIAPIHost,
        apiKey: this.decryptAPIKey(),
        providerType,
      }),
      instructions,
      tools,
      // Older conversations may still hold a system message; keep accepting them
      allowSystemInMessages: true,
      stopWhen: stepCountIs(this.maxSteps),
      ...reasoningOptions,
      temperature: 0.5,
    })
  }

  /**
   * Generate the reply to the conversation, streaming text, reasoning and tool calls as they happen
   *
   * @param messages Conversation so far, ending with the user message
   * @param getConnectionRecord Function to get current connection record
   */
  public async generateResponse(messages: AgentMessage[], getConnectionRecord?: () => any | undefined) {
    const responseMessage: AgentMessage = {
      id: getAgentMessageId(),
      role: 'assistant',
      content: '',
      parts: [],
    }
    let isFirstChunk = true
    let lastFinishReason: string | undefined

    this.abortController = new AbortController()

    try {
      const [instructions, tools] = await Promise.all([
        loadSystemPrompt(this.currentLang),
        this.buildTools(responseMessage),
      ])
      const appContext = renderAppContext(buildAppContext(this.deps))
      const agent = this.createAgent(`${instructions}\n\n${appContext}`, tools)
      const { fullStream } = await agent.stream({
        messages: this.buildMessageHistory(messages, getConnectionRecord),
        abortSignal: this.abortController.signal,
      })

      for await (const part of fullStream) {
        if (part.type === 'error') {
          throw part.error
        }
        if (part.type === 'abort') {
          this.handleAbort(responseMessage)
          return
        }
        if (part.type === 'finish-step') {
          lastFinishReason = part.finishReason
        }
        const parts = applyStreamPart(responseMessage.parts || [], part)
        if (parts === responseMessage.parts) {
          continue
        }
        responseMessage.parts = parts

        if (isFirstChunk) {
          isFirstChunk = false
          if (this.onStreamStart) {
            this.onStreamStart()
          }
        }
        if (this.onUpdate) {
          this.onUpdate({ ...responseMessage })
        }
      }

      // The last step still wanted tools, so the reply was cut off by the step limit
      if (lastFinishReason === 'tool-calls') {
        responseMessage.parts = appendStepLimit(responseMessage.parts || [], this.maxSteps)
      }
      responseMessage.content = getPartsText(responseMessage.parts || [])
      if (this.onComplete) {
        this.onComplete(responseMessage)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        this.handleAbort(responseMessage)
      } else if (this.onError) {
        // Keep what already happened, including tools that ran, so the reply is not lost with the error
        this.gate.denyAll()
        responseMessage.parts = stopParts(responseMessage.parts || [], 'Interrupted by an error')
        responseMessage.content = getPartsText(responseMessage.parts)
        this.onError(error, responseMessage)
      }
    } finally {
      this.abortController = null
    }
  }

  /**
   * Keeps the part of the reply that was already streamed and stops the waiting tool calls
   */
  private handleAbort(responseMessage: AgentMessage): void {
    this.gate.denyAll()
    responseMessage.parts = stopParts(responseMessage.parts || [])
    responseMessage.content = getPartsText(responseMessage.parts)
    if (this.onAbort) {
      this.onAbort(responseMessage)
    }
  }

  /**
   * Builds the tool set for one reply: MQTT tools plus MCP tools, with approval on every write
   */
  private async buildTools(responseMessage: AgentMessage): Promise<ToolSet> {
    const context = {
      gate: this.gate,
      getMode: (): PermissionMode => this.deps.getPermissionMode(),
      allowedTools: this.allowedTools,
      onAwaiting: (toolCallId: string) => {
        responseMessage.parts = setToolState(responseMessage.parts || [], toolCallId, 'awaiting-approval')
        if (this.onUpdate) {
          this.onUpdate({ ...responseMessage })
        }
      },
      // The reply keeps its own copy of the parts, so it must leave the waiting state too
      onApproved: (toolCallId: string) => {
        responseMessage.parts = approveToolPart(responseMessage.parts || [], toolCallId)
        if (this.onUpdate) {
          this.onUpdate({ ...responseMessage })
        }
      },
    }

    const tools: ToolSet = {}
    const mqttTools = createMQTTTools(this.deps)
    for (const [name, definition] of Object.entries(mqttTools)) {
      const alwaysAsk = AGENT_ALWAYS_ASK_TOOLS.has(name)
      tools[name] =
        AGENT_WRITE_TOOLS.has(name) || alwaysAsk ? withApproval(name, definition, context, alwaysAsk) : definition
    }
    const mcpTools = await loadMCPTools()
    for (const [name, definition] of Object.entries(mcpTools)) {
      tools[name] = withApproval(name, definition, context)
    }
    return tools
  }
}
