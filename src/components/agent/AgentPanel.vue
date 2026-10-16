<template>
  <div
    v-show="showAgent"
    id="agent"
    class="agent-panel"
    :class="{ 'is-full': mode === 'full', 'is-empty': isEmpty, 'is-narrow': isNarrow }"
    :style="panelStyle"
    @keydown.esc="onEsc"
  >
    <div v-if="mode === 'side'" class="resize-handle" :title="$t('agent.resize')" @mousedown="startResize"></div>
    <div class="agent-body">
      <agent-sidebar
        v-if="mode === 'full'"
        :conversations="conversations"
        :active-id="conversationId"
        :running-id="runningConversationId"
        @new-chat="newConversation"
        @select="selectConversation"
        @rename="renameConversation"
        @delete="deleteConversation"
      />
      <div class="chat" @click="showHistory = false">
        <agent-header
          :mode="mode"
          :conversation-title="currentTitle"
          @history="toggleHistory"
          @new-chat="newConversation"
          @toggle-full="toggleFull"
          @close="closePanel"
          @rename="renameActiveConversation"
        />

        <!-- History dropdown (side mode) -->
        <div v-if="showHistory && mode === 'side'" class="history-dropdown" @click.stop>
          <button class="new-chat" @click="newConversation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {{ $t('agent.newChat') }}
          </button>
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            class="conv"
            :class="{ active: conversation.id === conversationId }"
            @click="selectConversation(conversation.id)"
          >
            <span :title="conversation.title || $t('agent.untitled')">{{
              conversation.title || $t('agent.untitled')
            }}</span>
            <i v-if="conversation.id === runningConversationId" class="live"></i>
          </div>
        </div>

        <agent-messages
          ref="messages"
          :messages="messages"
          :streaming-message="streamingMessage"
          :is-sending="isSending"
          :connection-names="connectionNames"
          :error-message="errorMessage"
          @load-more="loadMoreMessages"
          @approve="handleApproval"
          @continue="handleContinue"
          @regenerate="regenerate"
          @copy="copyText"
          @retry="retry"
          @view="viewConnection"
          @suggest="sendMessage"
        />

        <agent-composer
          ref="composer"
          v-model="currentPublishMsg"
          :disabled="isSending || isResponseStream"
          :is-response-streaming="isResponseStream"
          :permission-mode="permissionMode"
          :connection-name="currentConnectionName"
          :connected="currentConnected"
          :model="model"
          @send="sendMessage"
          @abort-response="abortAIResponse"
          @preset-change="handleInputPresetChange"
          @update:permission-mode="setPermissionMode"
          @open-settings="goToSettings"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { getAgentMessageId } from '@/utils/idGenerator'
import useServices from '@/database/useServices'
import AgentHeader from './AgentHeader.vue'
import AgentSidebar from './AgentSidebar.vue'
import AgentMessages from './AgentMessages.vue'
import AgentComposer from './AgentComposer.vue'
import ConnectionsIndex from '@/views/connections/index.vue'
import { AgentMessage, AgentPresetPrompt } from '@/types/agent'
import { needsUserInput } from '@/utils/ai/preset'
import { SessionManager } from '@/utils/ai/agent/SessionManager'
import { MQTTXAgent } from '@/utils/ai/agent/MQTTXAgent'
import { setToolState } from '@/utils/ai/agent/messageParts'
import { ApprovalGate } from '@/utils/ai/agent/approval'
import type { ApprovalDecision, PermissionMode } from '@/utils/ai/agent/approval'
import { connectionBridge } from '@/utils/ai/agent/connectionBridge'
import { AgentToolDeps } from '@/utils/ai/agent/tools/types'
import { globalEventBus } from '@/utils/globalEventBus'

type Conversation = { id: string; title: string; updateAt: string }

const CONNECTION_CHANGE_TOOLS = new Set(['create_connection', 'update_connection', 'delete_connection'])

@Component({ components: { AgentHeader, AgentSidebar, AgentMessages, AgentComposer } })
export default class AgentPanel extends Vue {
  @Getter('openAIAPIHost') private openAIAPIHost!: string
  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: App['model']
  @Getter('currentLang') private currentLang!: Language
  @Getter('agentPermissionMode') private defaultPermissionMode!: PermissionMode
  @Getter('agentMaxSteps') private agentMaxSteps!: number

  public showAgent = false
  private mode: 'side' | 'full' = 'side'
  private panelWidth = 480
  // window.innerWidth is not reactive, so the 70vw cap follows this copy
  private windowWidth = window.innerWidth
  private conversations: Conversation[] = []
  private conversationId: string | null = null
  private messages: AgentMessage[] = []
  private page = 1
  private hasMore = true
  private isLoading = false
  private currentPublishMsg = ''
  private isSending = false
  private isResponseStream = false
  private streamingMessage: AgentMessage | null = null
  private errorMessage: string | null = null
  private connectionNames: Record<string, string> = {}
  private permissionMode: PermissionMode = 'ask'
  private autoConfirmed = false
  private showHistory = false
  private currPresetPrompt = ''

  private sessionManager = new SessionManager()
  private aiAgent: MQTTXAgent | null = null
  private gate = new ApprovalGate()
  private allowedTools = new Set<string>()
  private pendingStreamMessage: AgentMessage | null = null
  private updateFrame: number | null = null
  private resizing = false
  private runConversationId: string | null = null
  // The open "needs approval" notification, closed once nothing waits anymore
  private awaitingNotice: { close: () => void } | null = null
  private namesSyncedFor = new Set<string>()

  get isEmpty(): boolean {
    return this.messages.length === 0 && !this.isSending && !this.streamingMessage
  }

  get panelStyle(): Record<string, string> {
    if (this.mode === 'full') return {}
    const max = Math.max(360, Math.round(this.windowWidth * 0.7))
    return { width: `${Math.min(this.panelWidth, max)}px` }
  }

  get isNarrow(): boolean {
    const width = this.mode === 'full' ? this.windowWidth : parseInt(this.panelStyle.width, 10)
    return width < 420
  }

  get currentTitle(): string {
    return this.conversations.find((conversation) => conversation.id === this.conversationId)?.title || ''
  }

  get runningConversationId(): string | null {
    return this.isResponseStream ? this.conversationId : null
  }

  get currentConnectionName(): string {
    return connectionBridge.current()?.record.name || ''
  }

  get currentConnected(): boolean {
    return connectionBridge.current()?.getClient().connected === true
  }

  private getCurrentConnectionRecord(): ConnectionModel | undefined {
    if (this.$route.name !== 'ConnectionDetails' || this.$route.params.id === '0') {
      return undefined
    }
    return (this.$parent.$children.find((child: any) => child.currentConnection) as ConnectionsIndex | undefined)
      ?.currentConnection
  }

  private buildDeps(): AgentToolDeps {
    return {
      bridge: connectionBridge,
      services: useServices(),
      store: this.$store as any,
      router: this.$router as any,
      getPermissionMode: () => this.permissionMode,
    }
  }

  // ---------- panel shell ----------

  public togglePanel(): void {
    this.showAgent = !this.showAgent
    if (this.showAgent) {
      this.restoreMode()
      this.loadConversations()
    }
    this.emitStatus()
  }

  private closePanel() {
    this.showAgent = false
    this.emitStatus()
  }

  private toggleFull() {
    this.mode = this.mode === 'full' ? 'side' : 'full'
    localStorage.setItem('agentPanelMode', this.mode)
    this.emitStatus()
  }

  private restoreMode() {
    const stored = localStorage.getItem('agentPanelMode')
    if (stored === 'full' || stored === 'side') this.mode = stored
    const width = Number(localStorage.getItem('agentPanelWidth'))
    if (width >= 360) this.panelWidth = width
  }

  private onEsc() {
    if ((document.activeElement as HTMLElement)?.closest('.approval')) return
    if (this.mode === 'full') {
      this.mode = 'side'
      localStorage.setItem('agentPanelMode', this.mode)
      this.emitStatus()
    }
  }

  private startResize(event: MouseEvent) {
    this.resizing = true
    const startX = event.clientX
    const startWidth = this.panelStyle.width ? parseInt(this.panelStyle.width, 10) : this.panelWidth
    const onMove = (move: MouseEvent) => {
      const max = Math.max(360, Math.round(window.innerWidth * 0.7))
      this.panelWidth = Math.min(max, Math.max(360, startWidth + (startX - move.clientX)))
    }
    const onUp = () => {
      this.resizing = false
      localStorage.setItem('agentPanelWidth', String(this.panelWidth))
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  private toggleHistory() {
    this.showHistory = !this.showHistory
  }

  private emitStatus() {
    const awaiting = this.hasAwaitingApproval
    globalEventBus.emit('agent:open', { open: this.showAgent, full: this.mode === 'full' })
    globalEventBus.emit('agent:status', { running: this.isResponseStream, awaiting })
    if (awaiting && !this.showAgent && !this.awaitingNotice) {
      this.awaitingNotice = this.$notify({
        title: this.$t('agent.needsApproval') as string,
        message: '',
        type: 'warning',
        duration: 6000,
        offset: 30,
        onClick: () => this.togglePanel(),
      })
    }
    if ((!awaiting || this.showAgent) && this.awaitingNotice) {
      this.awaitingNotice.close()
      this.awaitingNotice = null
    }
  }

  get hasAwaitingApproval(): boolean {
    return (this.streamingMessage?.parts ?? []).some((part: any) => part.state === 'awaiting-approval')
  }

  // ---------- conversations ----------

  private async loadConversations() {
    const { agentConversationService } = useServices()
    this.conversations = (await agentConversationService.list()) as Conversation[]
    if (!this.conversations.length) {
      const created = await agentConversationService.create('')
      this.conversations = [created as Conversation]
    }
    if (!this.conversationId || !this.conversations.some((c) => c.id === this.conversationId)) {
      this.conversationId = this.conversations[0].id
    }
    await this.loadMessages({ reset: true })
  }

  private async newConversation() {
    this.stopRun()
    const { agentConversationService } = useServices()
    const created = (await agentConversationService.create('')) as Conversation
    this.conversations.unshift(created)
    this.conversationId = created.id
    this.messages = []
    this.page = 1
    this.hasMore = true
    this.errorMessage = null
    this.showHistory = false
  }

  private async selectConversation(id: string) {
    if (id === this.conversationId) return
    this.stopRun()
    this.conversationId = id
    this.errorMessage = null
    this.showHistory = false
    await this.loadMessages({ reset: true })
  }

  private async deleteConversation(id: string) {
    try {
      await this.$confirm(this.$t('agent.deleteConfirm') as string, this.$t('common.warning') as string, {
        type: 'warning',
      })
    } catch {
      return
    }
    const { agentConversationService } = useServices()
    await agentConversationService.delete(id)
    this.conversations = this.conversations.filter((conversation) => conversation.id !== id)
    if (!this.conversations.length) {
      await this.newConversation()
    } else if (this.conversationId === id) {
      this.conversationId = this.conversations[0].id
      await this.loadMessages({ reset: true })
    }
  }

  private async renameConversation(id: string) {
    const current = this.conversations.find((conversation) => conversation.id === id)
    try {
      const result = (await this.$prompt(this.$t('agent.renamePrompt') as string, this.$t('agent.rename') as string, {
        inputValue: current?.title || '',
      })) as unknown as { value: string }
      await this.applyRename(id, ((result.value as string) || '').slice(0, 80))
    } catch {
      // cancelled
    }
  }

  private renameActiveConversation() {
    if (this.conversationId) this.renameConversation(this.conversationId)
  }

  private async applyRename(id: string, title: string) {
    const { agentConversationService } = useServices()
    await agentConversationService.rename(id, title)
    const conversation = this.conversations.find((item) => item.id === id)
    if (conversation) conversation.title = title
  }

  private stopRun() {
    this.aiAgent?.abort()
    this.gate.denyAll()
    this.allowedTools.clear()
    this.isSending = false
    this.isResponseStream = false
    this.streamingMessage = null
    this.emitStatus()
  }

  private setPermissionMode(mode: PermissionMode) {
    if (mode === 'auto' && !this.autoConfirmed) {
      this.autoConfirmed = true
      this.$confirm(this.$t('agent.autoConfirm') as string, this.$t('common.warning') as string, {
        type: 'warning',
      }).catch(() => {
        this.permissionMode = 'ask'
      })
    }
    this.permissionMode = mode
  }

  private goToSettings() {
    this.$router.push({ name: 'Settings' })
  }

  private viewConnection(connectionId: string) {
    if (this.mode === 'full') {
      this.mode = 'side'
      localStorage.setItem('agentPanelMode', this.mode)
    }
    this.$router.push(`/recent_connections/${connectionId}`).catch(() => undefined)
  }

  private copyText(text: string) {
    navigator.clipboard?.writeText(text)
    this.$message.success(this.$tc('common.copied'))
  }

  // ---------- messages ----------

  public async sendMessage(msg?: string) {
    if (!(await this.checkAPIKey())) return

    const content = msg || this.currentPublishMsg
    if (!content) return

    if (!this.conversationId) {
      await this.loadConversations()
    }

    this.errorMessage = null
    this.sessionManager.startSession()

    await this.saveUserMessage(content)
    await this.generateAIResponse()
  }

  private async checkAPIKey(): Promise<boolean> {
    if (this.openAIAPIKey) return true
    try {
      await this.$confirm(this.$tc('agent.agentAPIKeyRequired'), this.$tc('common.warning'), {
        type: 'warning',
        confirmButtonText: this.$tc('agent.goToSetting'),
      })
      this.$router.push({ name: 'Settings' })
    } catch {
      // ignore cancel
    }
    return false
  }

  private async saveUserMessage(content: string): Promise<void> {
    const { agentMessageService, agentConversationService } = useServices()
    const requestMessage: AgentMessage = {
      id: getAgentMessageId(),
      role: 'user',
      content,
      conversationId: this.conversationId ?? undefined,
    }

    await agentMessageService.create(requestMessage)
    this.messages.push(requestMessage)
    this.currentPublishMsg = ''

    // The first user message names the conversation
    const conversation = this.conversations.find((item) => item.id === this.conversationId)
    if (conversation && !conversation.title) {
      const title = content.slice(0, 40)
      await agentConversationService.rename(conversation.id, title)
      conversation.title = title
    }
    this.scrollToBottom()
  }

  private async generateAIResponse(): Promise<void> {
    await this.refreshConnectionNames()
    this.initializeAgent()
    if (!this.aiAgent) throw new Error('AI Agent not initialized')

    this.isSending = true
    this.isResponseStream = true
    this.streamingMessage = null
    this.runConversationId = this.conversationId
    this.emitStatus()
    this.aiAgent.generateResponse(this.messages, () => this.getCurrentConnectionRecord())
  }

  private initializeAgent(): void {
    this.aiAgent = new MQTTXAgent({
      openAIAPIHost: this.openAIAPIHost,
      openAIAPIKey: this.openAIAPIKey,
      model: this.model,
      currentLang: this.currentLang,
      sessionManager: this.sessionManager,
      deps: this.buildDeps(),
      gate: this.gate,
      allowedTools: this.allowedTools,
      maxSteps: this.agentMaxSteps || 50,
      onStreamStart: () => {
        this.isSending = false
      },
      onUpdate: (responseMessage) => this.scheduleStreamUpdate(responseMessage),
      onError: async (error, partialMessage) => {
        this.errorMessage = error?.toString() ?? String(error)
        this.$message.error(`[Agent] API Error: ${this.errorMessage}`)
        this.$log.error(`[Agent] API Error: ${this.errorMessage}`)
        await this.finishWithMessage(partialMessage)
      },
      onComplete: async (responseMessage) => {
        await this.finishWithMessage(responseMessage)
      },
      onAbort: async (responseMessage) => {
        await this.finishWithMessage(responseMessage)
      },
    })
    this.$log.info(`[Agent] AI Agent initialized with Model: "${this.model}" from "${this.openAIAPIHost}"`)
  }

  private scheduleStreamUpdate(responseMessage: AgentMessage): void {
    this.pendingStreamMessage = responseMessage
    if (this.updateFrame !== null) return
    this.updateFrame = window.requestAnimationFrame(() => {
      this.updateFrame = null
      if (this.pendingStreamMessage) {
        this.streamingMessage = this.pendingStreamMessage
        this.syncConnectionNames(this.pendingStreamMessage)
        if ((this.$refs.messages as AgentMessages | undefined)?.isNearBottom()) this.scrollToBottom()
      }
      this.emitStatus()
    })
  }

  private async finishWithMessage(responseMessage: AgentMessage): Promise<void> {
    if (this.updateFrame !== null) {
      window.cancelAnimationFrame(this.updateFrame)
      this.updateFrame = null
    }
    const hasContent = Boolean(responseMessage.content) || (responseMessage.parts?.length ?? 0) > 0
    if (hasContent) {
      const { agentMessageService, agentConversationService } = useServices()
      const targetId = responseMessage.conversationId ?? this.runConversationId ?? this.conversationId
      const saved: AgentMessage = {
        ...responseMessage,
        id: getAgentMessageId(),
        conversationId: targetId ?? undefined,
      }
      await agentMessageService.create(saved)
      // Only show it if the user is still looking at the conversation it belongs to
      if (targetId && targetId === this.conversationId) {
        this.messages.push(saved)
      }
      if (targetId) await agentConversationService.touch(targetId)
      this.pendingStreamMessage = null
      this.streamingMessage = null
    }
    await this.refreshConnectionNames()
    this.resetResponseState()
  }

  private resetResponseState(): void {
    this.isSending = false
    this.isResponseStream = false
    this.currPresetPrompt = ''
    this.emitStatus()
  }

  private handleApproval({ toolCallId, decision }: { toolCallId: string; decision: ApprovalDecision }): void {
    this.gate.decide(toolCallId, decision)
    if (this.streamingMessage) {
      const state = decision === 'deny' ? 'denied' : 'running'
      this.streamingMessage = {
        ...this.streamingMessage,
        parts: setToolState(this.streamingMessage.parts || [], toolCallId, state),
      }
    }
    this.emitStatus()
  }

  private async handleContinue(): Promise<void> {
    await this.sendMessage(this.$tc('agent.continue'))
  }

  private async regenerate(): Promise<void> {
    const lastUser = [...this.messages].reverse().find((message) => message.role === 'user')
    const lastAssistant = [...this.messages].reverse().find((message) => message.role === 'assistant')
    if (!lastUser) return
    if (lastAssistant) {
      const { agentMessageService } = useServices()
      await agentMessageService.delete(lastAssistant.id)
      this.messages = this.messages.filter((message) => message.id !== lastAssistant.id)
    }
    this.errorMessage = null
    await this.generateAIResponse()
  }

  private async retry(): Promise<void> {
    await this.regenerate()
  }

  /**
   * Refreshes the names when a step created, renamed or deleted a connection, or uses one the map does not know yet
   */
  private syncConnectionNames(message: AgentMessage): void {
    let stale = false
    for (const part of message.parts || []) {
      if (part.type !== 'tool') continue
      const id = (part.input as { connectionId?: string } | undefined)?.connectionId
      // Each change and each unknown id triggers one refresh only
      const key = CONNECTION_CHANGE_TOOLS.has(part.toolName) && part.state === 'done' ? part.toolCallId : id
      if (!key || this.namesSyncedFor.has(key) || (key === id && this.connectionNames[id])) continue
      this.namesSyncedFor.add(key)
      stale = true
    }
    if (stale) this.refreshConnectionNames()
  }

  private async refreshConnectionNames(): Promise<void> {
    const { connectionService } = useServices()
    const connections = (await connectionService.getAll()) ?? []
    this.connectionNames = connections.reduce<Record<string, string>>((acc, connection) => {
      if (connection.id) acc[connection.id] = connection.name
      return acc
    }, {})
  }

  private async loadMessages({ reset }: { reset?: boolean } = {}) {
    if (!this.conversationId) return
    if (reset === true) {
      this.messages = []
      this.page = 1
    }
    this.isLoading = true
    const { agentMessageService } = useServices()
    try {
      const { messages: newMessages, hasMore } = await agentMessageService.get(this.conversationId, this.page)
      this.hasMore = hasMore
      this.messages = this.removeDuplicates([...(newMessages as AgentMessage[]), ...this.messages])
      if (this.messages.length) this.$nextTick(() => this.scrollToBottom('auto'))
    } finally {
      this.isLoading = false
    }
  }

  private loadMoreMessages() {
    if (this.hasMore && !this.isLoading) {
      this.page += 1
      this.loadMessages()
    }
  }

  private removeDuplicates(messages: AgentMessage[]): AgentMessage[] {
    const seen = new Set<string>()
    return messages.filter((message) => {
      const duplicate = seen.has(message.id)
      seen.add(message.id)
      return !duplicate
    })
  }

  private scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    ;(this.$refs.messages as AgentMessages | undefined)?.scrollToBottom(behavior)
  }

  private async handleInputPresetChange(data: AgentPresetPrompt) {
    this.stopRun()
    await this.newConversation()
    this.currPresetPrompt = data.prompt
    this.sessionManager.updatePreset(data.prompt)

    const promptValue = data.promptMap[this.currPresetPrompt]
    if (typeof promptValue === 'object' && typeof promptValue.system === 'string') {
      this.messages.push({ id: getAgentMessageId(), role: 'system', content: promptValue.system })
    }
    const userPrompt = typeof promptValue === 'object' && 'user' in promptValue ? promptValue.user : promptValue
    if (typeof userPrompt === 'string') {
      this.currentPublishMsg = userPrompt
      if (needsUserInput.includes(this.currPresetPrompt)) {
        this.$nextTick(() => (this.$refs.composer as AgentComposer | undefined)?.focus())
        return
      }
      this.sendMessage(this.currentPublishMsg)
    }
  }

  private abortAIResponse(): void {
    this.aiAgent?.abort()
    this.gate.denyAll()
  }

  private onGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
      event.preventDefault()
      this.togglePanel()
    }
  }

  @Watch('showAgent')
  private onShowChange() {
    this.emitStatus()
    // Connections may have been renamed or created outside the Agent; history shows the current names
    if (this.showAgent) this.refreshConnectionNames()
    this.$nextTick(() => setTimeout(() => this.scrollToBottom(), 100))
  }

  private created() {
    this.permissionMode = this.defaultPermissionMode || 'ask'
    this.restoreMode()
    const services = useServices()
    connectionBridge.configure({
      router: this.$router as any,
      connectionExists: async (id: string) => Boolean(await services.connectionService.get(id)),
    })
    globalEventBus.on('agent:toggle', this.togglePanel)
    globalEventBus.on('agent:new', this.newConversation)
    document.addEventListener('keydown', this.onGlobalKeydown)
    window.addEventListener('resize', this.onWindowResize)
    this.loadConversations()
  }

  private onWindowResize() {
    this.windowWidth = window.innerWidth
  }

  beforeDestroy() {
    globalEventBus.off('agent:toggle', this.togglePanel)
    globalEventBus.off('agent:new', this.newConversation)
    document.removeEventListener('keydown', this.onGlobalKeydown)
    window.removeEventListener('resize', this.onWindowResize)
  }
}
</script>

<style lang="scss">
.history-dropdown {
  position: absolute;
  top: 64px;
  left: 8px;
  right: 8px;
  z-index: 25;
  max-height: 60vh;
  overflow-y: auto;
  background: var(--color-bg-normal);
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  box-shadow: 0 8px 28px var(--color-shadow-card);
  padding: 8px;
  .new-chat {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 36px;
    padding: 0 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-normal);
    color: var(--color-text-title);
    font-size: 13px;
  }
  .conv {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 34px;
    padding: 0 10px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    color: var(--color-text-default);
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &:hover {
      background: var(--color-bg-item);
    }
    &.active {
      background: var(--color-bg-item);
      color: var(--color-text-title);
      font-weight: 500;
    }
    .live {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-main-green);
    }
  }
}
</style>
