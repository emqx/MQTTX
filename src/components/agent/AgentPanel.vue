<template>
  <transition name="agent-pop" @after-leave="closingFull = false">
    <div
      v-show="showAgent"
      id="agent"
      class="agent-panel"
      :class="{ 'is-full': mode === 'full', 'is-empty': isEmpty, 'is-narrow': isNarrow, 'is-dragging': dragging }"
      :style="panelStyle"
      @keydown.esc="onEsc"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="fileDropActive" class="drop-overlay">
        <div class="drop-overlay-text">{{ $t('agent.attachments.dropHere') }}</div>
      </div>
      <template v-if="mode === 'float'">
        <div
          v-for="edge in edges"
          :key="edge"
          class="float-handle"
          :class="`edge-${edge}`"
          @mousedown.prevent="startFloatResize(edge, $event)"
        ></div>
      </template>
      <div class="agent-body">
        <agent-sidebar
          v-if="mode === 'full'"
          :class="{ 'is-collapsed': historyCollapsed, 'is-resizing': historyResizing }"
          :style="{ width: `${historyCollapsed ? 0 : historyWidth}px`, '--agent-history-inner': `${historyWidth}px` }"
          :conversations="conversations"
          :active-id="conversationId"
          :running-id="runningConversationId"
          @new-chat="newConversation"
          @select="selectConversation"
          @rename="renameConversation"
          @delete="deleteConversation"
        />
        <div
          v-if="mode === 'full' && !historyCollapsed"
          class="history-resize"
          :title="$t('agent.resize')"
          @mousedown.prevent="startHistoryResize"
        ></div>
        <div class="chat" @click="showHistory = false">
          <agent-header
            :mode="mode"
            :conversation-title="currentTitle"
            :sidebar-collapsed="historyCollapsed"
            @mousedown.native="startFloatDrag"
            @history="toggleHistory"
            @new-chat="newConversation"
            @toggle-full="toggleFull"
            @toggle-sidebar="toggleSidebar"
            @close="closePanel"
            @rename="renameActiveConversation"
          />

          <!-- History dropdown (float mode) -->
          <div v-if="showHistory && mode === 'float'" class="history-dropdown" @click.stop>
            <button class="new-chat" @click="newConversation">
              <i class="el-icon-plus"></i>
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
            @retry="regenerate"
            @copy="copyText"
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
            :agent-reasoning="agentReasoning"
            :connections="connectionMentions"
            :current-connection-id="currentConnectionId"
            @send="sendMessage"
            @abort-response="abortAIResponse"
            @update:permissionMode="setPermissionMode"
            @update:model="setModel"
            @update:agentReasoning="setReasoning"
            @open-settings="goToSettings"
          />
        </div>
      </div>
    </div>
  </transition>
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
import { AgentAttachmentPart, AgentMessage, AgentMessagePart } from '@/types/agent'
import { MQTTXAgent } from '@/utils/ai/agent/MQTTXAgent'
import { setToolState } from '@/utils/ai/agent/messageParts'
import { describeAgentError } from '@/utils/ai/agent/errors'
import { deleteConversationFiles } from '@/utils/ai/agent/files'
import { materializeAttachments, OutgoingMessage } from '@/utils/ai/agent/attachments'
import { ApprovalGate } from '@/utils/ai/agent/approval'
import type { ApprovalDecision, PermissionMode } from '@/utils/ai/agent/approval'
import type { AgentReasoning } from '@/utils/ai/reasoning'
import { isConnectionConnected } from '@/utils/ai/agent/mentions'
import type { ConnectionMention } from '@/utils/ai/agent/mentions'
import { connectionBridge } from '@/utils/ai/agent/connectionBridge'
import { AgentToolDeps } from '@/utils/ai/agent/tools/types'
import { globalEventBus } from '@/utils/globalEventBus'
import {
  AGENT_ROUTE_NAME,
  agentRouteLocation,
  isAgentRoute,
  leaveFullScreenTarget,
  panelModeForRoute,
  previousLocationForRoute,
} from '@/utils/ai/agent/agentRoute'
import {
  isAutoConfirmedInSession,
  readSessionPermissionMode,
  rememberAutoConfirmed,
  resolveInitialPermissionMode,
  writeSessionPermissionMode,
} from '@/utils/ai/agent/permissionMode'
import type { Route } from 'vue-router'
import {
  clampFloatRect,
  defaultFloatRect,
  moveFloatRect,
  resizeFloatRect,
  FloatRect,
  ResizeEdge,
} from '@/utils/ai/agent/floatRect'

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
  @Getter('agentReasoning') private agentReasoning!: AgentReasoning
  @Getter('activeConnection') private activeConnection!: ActiveConnection

  // Full screen is the Agent route; the float window is a local flag. The panel is a singleton in
  // Home.vue so a running reply, approval or stream keeps working when the mode changes.
  private floatOpen = false
  private exitingFull: 'float' | 'close' | null = null
  /** Keeps the full screen layout while the closing animation plays, so the page does not shrink first */
  private closingFull = false
  private previousLocation: string | null = null
  private floatRect: FloatRect = defaultFloatRect({ width: window.innerWidth, height: window.innerHeight })
  private dragging = false
  private edges: ResizeEdge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
  private historyWidth = 220
  private historyCollapsed = false
  // Dragging the edge resizes immediately; only the toggle animates the width
  private historyResizing = false
  // window.innerWidth is not reactive, so the full page width follows this copy
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
  /** Full records of the connections, for the `@` mention menu and the labels of tool steps */
  private connections: ConnectionModel[] = []
  private permissionMode: PermissionMode = 'ask'
  private autoConfirmed = false
  private showHistory = false
  private dragDepth = 0
  private lastStatus: { open: boolean; running: boolean; awaiting: boolean } | null = null

  private aiAgent: MQTTXAgent | null = null
  private gate = new ApprovalGate()
  private allowedTools = new Set<string>()
  private pendingStreamMessage: AgentMessage | null = null
  private updateFrame: number | null = null
  private runConversationId: string | null = null
  // The open "needs approval" notification, closed once nothing waits anymore
  private awaitingNotice: { close: () => void } | null = null
  private namesSyncedFor = new Set<string>()

  get isEmpty(): boolean {
    return this.messages.length === 0 && !this.isSending && !this.streamingMessage
  }

  /** The route is the only source of full screen; the float window is a local flag */
  get isFullRoute(): boolean {
    return isAgentRoute(this.$route.name)
  }

  get mode(): 'float' | 'full' {
    return this.closingFull ? 'full' : panelModeForRoute(this.$route.name)
  }

  get showAgent(): boolean {
    return this.isFullRoute || this.floatOpen
  }

  get panelStyle(): Record<string, string> {
    if (this.mode === 'full') return {}
    const { x, y, width, height } = this.floatRect
    return { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` }
  }

  get isNarrow(): boolean {
    const width = this.mode === 'full' ? this.windowWidth : this.floatRect.width
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

  /** Id of the connection the user is looking at, so its mention is listed first */
  get currentConnectionId(): string {
    return connectionBridge.current()?.connectionId ?? ''
  }

  /** Id -> name, for the tool steps and the chips of sent messages */
  get connectionNames(): Record<string, string> {
    return this.connections.reduce<Record<string, string>>((names, connection) => {
      if (connection.id) names[connection.id] = connection.name
      return names
    }, {})
  }

  /** The connections the `@` menu offers, with the live state shown by its dot */
  get connectionMentions(): ConnectionMention[] {
    return this.connections
      .filter((connection) => Boolean(connection.id))
      .map((connection) => ({
        id: connection.id as string,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        connected: isConnectionConnected(this.activeConnection, connection.id as string),
      }))
  }

  private buildDeps(): AgentToolDeps {
    return {
      bridge: connectionBridge,
      services: useServices(),
      store: this.$store as any,
      router: this.$router as any,
      getPermissionMode: () => this.permissionMode,
      getConversationId: () => this.conversationId ?? '',
    }
  }

  // ---------- panel shell ----------

  /**
   * The entry decides the mode: the Leftbar, Cmd/Ctrl+J and the full screen button open the Agent
   * page; the Agent buttons on the connection and script pages open the float window
   */
  public open(mode: 'float' | 'full'): void {
    // Reopening during the closing animation must not keep the full screen layout
    this.closingFull = false
    const wasOpen = this.showAgent
    if (mode === 'full') {
      this.floatOpen = false
      if (!this.isFullRoute) {
        this.$router.push(agentRouteLocation(this.conversationId)).catch(() => undefined)
      }
    } else {
      this.floatOpen = true
    }
    if (!wasOpen) this.loadConversations()
    this.emitStatus()
    // Focus the composer when the window opens, but not when it only changed mode
    if (!wasOpen) {
      this.$nextTick(() => (this.$refs.composer as AgentComposer | undefined)?.focus())
    }
  }

  public closePanel(): void {
    if (this.isFullRoute) {
      this.exitFullScreen('close')
      return
    }
    this.floatOpen = false
    this.emitStatus()
  }

  /**
   * Leaves the Agent page for the page the user came from. `float` keeps the panel open as the float
   * window; `close` hides it.
   */
  private exitFullScreen(intent: 'float' | 'close'): void {
    this.exitingFull = intent
    if (intent === 'close') {
      this.floatOpen = false
      this.closingFull = true
    }
    const target = leaveFullScreenTarget(this.previousLocation)
    this.previousLocation = null
    this.$router.push(target).catch(() => undefined)
  }

  /** Closes the panel and goes to another page, used when the Agent needs a key or a settings change */
  private closeAndGo(location: { name: string }): void {
    this.floatOpen = false
    if (this.isFullRoute) {
      this.exitingFull = 'close'
      this.closingFull = true
      this.previousLocation = null
    }
    this.$router.push(location).catch(() => undefined)
  }

  private toggleFull() {
    if (this.isFullRoute) {
      this.exitFullScreen('float')
    } else {
      this.open('full')
    }
  }

  private restoreWidth() {
    const historyWidth = Number(localStorage.getItem('agentHistoryWidth'))
    if (historyWidth >= 180) this.historyWidth = historyWidth
    this.historyCollapsed = localStorage.getItem('agentHistoryCollapsed') === 'true'
  }

  private loadFloatRect(): FloatRect {
    const viewport = this.getViewport()
    try {
      const stored = localStorage.getItem('agentFloatRect')
      if (stored) {
        const rect = JSON.parse(stored) as Partial<FloatRect>
        if (['x', 'y', 'width', 'height'].every((key) => typeof rect[key as keyof FloatRect] === 'number')) {
          return clampFloatRect(rect as FloatRect, viewport)
        }
      }
    } catch {
      // fall back to the default position
    }
    return clampFloatRect(defaultFloatRect(viewport), viewport)
  }

  private toggleSidebar() {
    this.historyCollapsed = !this.historyCollapsed
    localStorage.setItem('agentHistoryCollapsed', String(this.historyCollapsed))
  }

  /** Runs `onMove` for every mouse move until the button is released, then calls `onEnd` */
  private trackMouse(onMove: (event: MouseEvent) => void, onEnd: () => void) {
    const up = () => {
      onEnd()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', up)
  }

  /** Dragging the history edge resizes it; dragging it nearly shut hides it, dragging back reopens it */
  private startHistoryResize(event: MouseEvent) {
    const startX = event.clientX
    const startWidth = this.historyWidth
    this.historyResizing = true
    this.trackMouse(
      (move) => {
        const width = startWidth + move.clientX - startX
        this.historyCollapsed = width < 120
        if (!this.historyCollapsed) this.historyWidth = Math.min(360, Math.max(180, width))
      },
      () => {
        this.historyResizing = false
        localStorage.setItem('agentHistoryWidth', String(this.historyWidth))
        localStorage.setItem('agentHistoryCollapsed', String(this.historyCollapsed))
      },
    )
  }

  // ---------- file drop ----------

  get fileDropActive(): boolean {
    return this.dragDepth > 0
  }

  private hasDraggedFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
  }

  private onDragEnter(event: DragEvent) {
    if (this.hasDraggedFiles(event)) this.dragDepth += 1
  }

  private onDragLeave() {
    this.dragDepth = Math.max(0, this.dragDepth - 1)
  }

  private onDrop(event: DragEvent) {
    this.dragDepth = 0
    const files = Array.from(event.dataTransfer?.files ?? [])
    if (files.length) (this.$refs.composer as AgentComposer | undefined)?.addFiles(files)
  }

  private onEsc() {
    if ((document.activeElement as HTMLElement)?.closest('.approval')) return
    if (this.isFullRoute) {
      this.exitFullScreen('float')
    } else {
      this.closePanel()
    }
  }

  private getViewport() {
    return { width: window.innerWidth, height: window.innerHeight }
  }

  /** Drags the float window by its title bar; buttons and inputs keep their own behavior */
  private startFloatDrag(event: MouseEvent) {
    if (this.mode !== 'float') return
    if ((event.target as HTMLElement).closest('button, input, textarea, a, .el-dropdown')) return
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const start = { ...this.floatRect }
    this.dragging = true
    this.trackMouse(
      (move) => {
        this.floatRect = moveFloatRect(start, move.clientX - startX, move.clientY - startY, this.getViewport())
      },
      () => {
        this.dragging = false
        localStorage.setItem('agentFloatRect', JSON.stringify(this.floatRect))
      },
    )
  }

  private startFloatResize(edge: ResizeEdge, event: MouseEvent) {
    const startX = event.clientX
    const startY = event.clientY
    const start = { ...this.floatRect }
    this.dragging = true
    this.trackMouse(
      (move) => {
        this.floatRect = resizeFloatRect(start, edge, move.clientX - startX, move.clientY - startY, this.getViewport())
      },
      () => {
        this.dragging = false
        localStorage.setItem('agentFloatRect', JSON.stringify(this.floatRect))
      },
    )
  }

  private toggleHistory() {
    this.showHistory = !this.showHistory
  }

  private emitStatus() {
    const awaiting = this.hasAwaitingApproval
    const open = this.showAgent
    const running = this.isResponseStream
    // The status dot and the notice only depend on these values, so an unchanged status is not broadcast again
    if (
      this.lastStatus &&
      this.lastStatus.open === open &&
      this.lastStatus.running === running &&
      this.lastStatus.awaiting === awaiting
    ) {
      return
    }
    this.lastStatus = { open, running, awaiting }
    globalEventBus.emit('agent:status', { running, awaiting })
    if (awaiting && !open && !this.awaitingNotice) {
      this.awaitingNotice = this.$notify({
        title: this.$t('agent.needsApproval') as string,
        message: '',
        type: 'warning',
        duration: 6000,
        offset: 30,
        onClick: () => this.open(this.mode),
      })
    }
    if ((!awaiting || open) && this.awaitingNotice) {
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
    // A reload or a deep link on /agent/<id> asks for one specific conversation
    const requested = this.isFullRoute ? (this.$route.params.conversationId as string | undefined) : undefined
    if (requested && this.conversations.some((c) => c.id === requested)) {
      this.conversationId = requested
    } else if (!this.conversationId || !this.conversations.some((c) => c.id === this.conversationId)) {
      this.conversationId = this.conversations[0].id
    }
    this.updateRouteConversation()
    await this.loadMessages({ reset: true })
  }

  /** Mirrors the active conversation into the URL while the Agent page is open */
  private updateRouteConversation(): void {
    if (!this.isFullRoute || !this.conversationId) return
    const requested = this.$route.params.conversationId as string | undefined
    if (requested === this.conversationId) return
    this.$router.replace(agentRouteLocation(this.conversationId)).catch(() => undefined)
  }

  @Watch('$route')
  private async onRouteChange(to: Route, from: Route) {
    const wasFull = from.name === AGENT_ROUTE_NAME
    const isFull = isAgentRoute(to.name)
    if (isFull && !wasFull) {
      // Remember where the full page was opened from, to return there on exit
      this.previousLocation = previousLocationForRoute(from)
    }
    if (wasFull && !isFull) {
      // Another page replaced the full Agent: shrink to the float window unless the exit meant to close
      this.floatOpen = this.exitingFull !== 'close'
      this.exitingFull = null
    }
    this.emitStatus()
    if (isFull) {
      const requested = to.params.conversationId as string | undefined
      if (requested && requested !== this.conversationId && this.conversations.some((c) => c.id === requested)) {
        await this.selectConversation(requested)
      }
      this.updateRouteConversation()
    }
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
    this.updateRouteConversation()
  }

  private async selectConversation(id: string) {
    if (id === this.conversationId) return
    this.stopRun()
    this.conversationId = id
    this.errorMessage = null
    this.showHistory = false
    await this.loadMessages({ reset: true })
    this.updateRouteConversation()
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
    await deleteConversationFiles(id)
    this.conversations = this.conversations.filter((conversation) => conversation.id !== id)
    if (!this.conversations.length) {
      await this.newConversation()
    } else if (this.conversationId === id) {
      this.conversationId = this.conversations[0].id
      await this.loadMessages({ reset: true })
      this.updateRouteConversation()
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
      this.$confirm(this.$t('agent.autoConfirm') as string, this.$t('common.warning') as string, {
        type: 'warning',
      })
        .then(() => {
          this.autoConfirmed = true
          rememberAutoConfirmed()
          this.applyPermissionMode('auto')
        })
        .catch(() => undefined)
      return
    }
    this.applyPermissionMode(mode)
  }

  /** Applies the mode and remembers it for this session, so a reload keeps it */
  private applyPermissionMode(mode: PermissionMode) {
    this.permissionMode = mode
    writeSessionPermissionMode(mode)
  }

  /** The settings default applies only while this session has not picked a mode itself */
  @Watch('defaultPermissionMode')
  private onDefaultPermissionModeChange(mode: PermissionMode) {
    if (readSessionPermissionMode() === null) this.permissionMode = mode
  }

  private setModel(model: App['model']) {
    this.$store.dispatch('SET_MODEL', { model })
  }

  private setReasoning(agentReasoning: AgentReasoning) {
    this.$store.dispatch('SET_AGENT_REASONING', { agentReasoning })
  }

  /** The float window would cover the settings form, so the panel closes in both modes */
  private goToSettings() {
    this.closeAndGo({ name: 'Settings' })
  }

  private viewConnection(connectionId: string) {
    // Leaving the Agent route turns the full page into the float window
    this.$router.push(`/recent_connections/${connectionId}`).catch(() => undefined)
  }

  private copyText(text: string) {
    navigator.clipboard?.writeText(text)
    this.$message.success(this.$tc('common.copied'))
  }

  // ---------- messages ----------

  public async sendMessage(payload?: string | OutgoingMessage) {
    const content = typeof payload === 'string' ? payload : payload?.content ?? ''
    const pending = typeof payload === 'string' ? [] : payload?.attachments ?? []
    const skill = typeof payload === 'string' ? undefined : payload?.skill
    const connections = typeof payload === 'string' ? [] : payload?.connections ?? []
    if (!content && !pending.length && !skill && !connections.length) return

    if (!(await this.checkAPIKey())) return

    if (!this.conversationId) {
      await this.loadConversations()
    }
    if (!this.conversationId) return

    this.errorMessage = null

    const parts: AgentMessagePart[] = await materializeAttachments(pending, this.conversationId)
    if (skill) parts.push({ type: 'skill', skill: skill.skill })
    for (const connection of connections) {
      parts.push({ type: 'connection', connectionId: connection.id, name: connection.name })
    }
    await this.saveUserMessage(content, parts)
    await this.generateAIResponse()
  }

  private async checkAPIKey(): Promise<boolean> {
    if (this.openAIAPIKey) return true
    try {
      await this.$confirm(this.$tc('agent.agentAPIKeyRequired'), this.$tc('common.warning'), {
        type: 'warning',
        confirmButtonText: this.$tc('agent.goToSetting'),
      })
      this.closeAndGo({ name: 'Settings' })
    } catch {
      // ignore cancel
    }
    return false
  }

  private async saveUserMessage(content: string, parts: AgentMessagePart[] = []): Promise<void> {
    const { agentMessageService, agentConversationService } = useServices()
    const requestMessage: AgentMessage = {
      id: getAgentMessageId(),
      role: 'user',
      content,
      parts: parts.length ? parts : undefined,
      conversationId: this.conversationId ?? undefined,
    }

    await agentMessageService.create(requestMessage)
    this.messages.push(requestMessage)
    this.currentPublishMsg = ''

    // The first user message names the conversation
    const conversation = this.conversations.find((item) => item.id === this.conversationId)
    if (conversation && !conversation.title) {
      const firstAttachment = parts.find((part): part is AgentAttachmentPart => part.type === 'attachment')
      const title = (content || firstAttachment?.name || '').slice(0, 40)
      await agentConversationService.rename(conversation.id, title)
      conversation.title = title
    }
    this.scrollToBottom()
  }

  private async generateAIResponse(): Promise<void> {
    // The names are only needed while rendering tool steps, so this does not block the request
    this.refreshConnections().catch((error) => this.$log.warn(`[Agent] Failed to refresh connection names: ${error}`))
    this.initializeAgent()
    if (!this.aiAgent) throw new Error('AI Agent not initialized')

    this.isSending = true
    this.isResponseStream = true
    this.streamingMessage = null
    this.runConversationId = this.conversationId
    this.emitStatus()
    this.aiAgent.generateResponse(this.messages)
  }

  private initializeAgent(): void {
    this.aiAgent = new MQTTXAgent({
      openAIAPIHost: this.openAIAPIHost,
      openAIAPIKey: this.openAIAPIKey,
      model: this.model,
      currentLang: this.currentLang,
      deps: this.buildDeps(),
      gate: this.gate,
      allowedTools: this.allowedTools,
      maxSteps: this.agentMaxSteps || 50,
      reasoning: this.agentReasoning,
      onStreamStart: () => {
        this.isSending = false
      },
      onUpdate: (responseMessage) => this.scheduleStreamUpdate(responseMessage),
      onError: async (error, partialMessage) => {
        this.errorMessage = describeAgentError(error)
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
    await this.refreshConnections()
    this.resetResponseState()
  }

  private resetResponseState(): void {
    this.isSending = false
    this.isResponseStream = false
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
    if (stale) this.refreshConnections()
  }

  private async refreshConnections(): Promise<void> {
    const { connectionService } = useServices()
    this.connections = (await connectionService.getAll()) ?? []
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

  private abortAIResponse(): void {
    this.aiAgent?.abort()
    this.gate.denyAll()
  }

  private onGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
      event.preventDefault()
      if (this.showAgent) this.closePanel()
      else this.open('full')
    }
  }

  /**
   * Switching modes while the panel stays open: the panel box moves and scales from its old rect to
   * the new one, and the content fades in once the box is nearly there, so stretched text never shows.
   * Only transform and opacity animate, so the compositor keeps it smooth while the new page renders.
   * Runs before the re-render, so the panel still has its old size here.
   */
  @Watch('mode')
  private animateModeChange() {
    const panel = this.$el as HTMLElement
    if (!this.showAgent || !panel.offsetWidth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const from = panel.getBoundingClientRect()
    this.$nextTick(() => {
      const to = panel.getBoundingClientRect()
      const [x, y] = [from.left - to.left, from.top - to.top]
      const start = `translate(${x}px, ${y}px) scale(${from.width / to.width}, ${from.height / to.height})`
      const timing = { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
      panel.animate(
        [
          { transformOrigin: '0 0', transform: start },
          { transformOrigin: '0 0', transform: 'none' },
        ],
        timing,
      )
      panel
        .querySelector('.agent-body')
        ?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], timing)
    })
  }

  @Watch('showAgent')
  private onShowChange() {
    this.emitStatus()
    // Connections may have been renamed or created outside the Agent; history shows the current names
    if (this.showAgent) this.refreshConnections()
    this.$nextTick(() => setTimeout(() => this.scrollToBottom(), 100))
  }

  private created() {
    // A mode picked in this session wins over the settings default, so a reload keeps Auto
    this.permissionMode = resolveInitialPermissionMode(readSessionPermissionMode(), this.defaultPermissionMode)
    // Auto already confirmed in this session does not need the dialog again
    this.autoConfirmed = isAutoConfirmedInSession()
    this.restoreWidth()
    this.floatRect = this.loadFloatRect()
    const services = useServices()
    connectionBridge.configure({
      router: this.$router as any,
      connectionExists: async (id: string) => Boolean(await services.connectionService.get(id)),
    })
    document.addEventListener('keydown', this.onGlobalKeydown)
    window.addEventListener('resize', this.onWindowResize)
    this.loadConversations()
  }

  private onWindowResize() {
    this.windowWidth = window.innerWidth
    this.floatRect = clampFloatRect(this.floatRect, this.getViewport())
  }

  beforeDestroy() {
    document.removeEventListener('keydown', this.onGlobalKeydown)
    window.removeEventListener('resize', this.onWindowResize)
  }
}
</script>

<style lang="scss">
.history-dropdown {
  position: absolute;
  top: 48px;
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
