<template>
  <div class="composer-wrap" @keydown.esc="onEsc">
    <div class="menu" :class="{ show: showModeMenu }">
      <button
        v-for="option in permissionModes"
        :key="option.mode"
        class="opt"
        :class="{ sel: permissionMode === option.mode }"
        @click="chooseMode(option.mode)"
      >
        <i class="perm-ico" :class="option.icon" :style="option.color ? { color: option.color } : null"></i>
        <div>
          <div class="t">{{ $t(`agent.permission.${option.mode}`) }}</div>
          <div class="d">{{ $t(`agent.permission.${option.mode}Description`) }}</div>
        </div>
        <i class="check el-icon-check"></i>
      </button>
    </div>

    <div class="menu model-menu" :class="{ show: showModelMenu }" data-test="model-menu">
      <div v-if="modelProvider" class="menu-title">
        <ai-provider-icon :provider="modelProvider.value" />
        <span>{{ modelProvider.value }}</span>
      </div>
      <button
        v-for="option in modelOptions"
        :key="option.value"
        class="opt"
        :class="{ sel: option.value === model }"
        @click="chooseModel(option.value)"
      >
        <ai-provider-icon :provider="modelProvider ? modelProvider.value : ''" :model="option.value" />
        <span class="t">{{ option.label }}</span>
        <i class="check el-icon-check"></i>
      </button>
      <label v-if="showReasoning" class="reasoning" @click.stop>
        <span class="t">{{ $t('agent.reasoningTitle') }}</span>
        <span class="reasoning-select">
          <select
            :value="currentReasoning"
            :aria-label="$t('agent.reasoningTitle')"
            data-test="reasoning-select"
            @change="chooseReasoning($event.target.value)"
          >
            <option v-for="level in reasoningLevels" :key="level" :value="level">{{ $t(levelLabel(level)) }}</option>
          </select>
          <i class="el-icon-arrow-down"></i>
        </span>
      </label>
      <button class="opt settings" @click="$emit('open-settings')">
        <span class="t">{{ $t('agent.modelSettings') }}</span>
      </button>
    </div>

    <div class="menu skill-menu" :class="{ show: skillMenuOpen }" data-test="skill-menu" @click.stop>
      <button
        v-for="(skill, index) in filteredSkills"
        :key="skill.name"
        class="opt"
        :class="{ sel: index === skillMenuIndex }"
        :data-skill="skill.name"
        @mousedown.prevent
        @mousemove="skillMenuIndex = index"
        @click="applySkill(skill.name)"
      >
        <i class="skill-ico" :class="skillIcon(skill.name)"></i>
        <div>
          <div class="t">{{ skillLabel(skill.name) }}</div>
          <div class="d">{{ skillDescription(skill.name) }}</div>
        </div>
      </button>
    </div>

    <!-- Reuses the Skill menu styles: same shell, same rows, one row per connection -->
    <div
      ref="mentionMenu"
      class="menu skill-menu mention-menu"
      :class="{ show: mentionMenuOpen }"
      data-test="mention-menu"
      @click.stop
    >
      <div class="menu-title">{{ $t('agent.mentions.title') }}</div>
      <button
        v-for="(connection, index) in filteredConnections"
        :key="connection.id"
        class="opt"
        :class="{ sel: index === mentionMenuIndex }"
        :data-connection="connection.id"
        @mousedown.prevent
        @mousemove="mentionMenuIndex = index"
        @click="applyConnection(connection)"
      >
        <i class="mention-dot" :class="{ off: !connection.connected }"></i>
        <span class="mention-name" :title="connection.name">
          <span
            v-for="(piece, pieceIndex) in highlightPieces(connection.name)"
            :key="pieceIndex"
            :class="{ hit: piece.hit }"
            >{{ piece.text }}</span
          >
        </span>
        <span v-if="connection.id === currentConnectionId" class="mention-current">{{
          $t('agent.mentions.currentBadge')
        }}</span>
        <span class="mention-endpoint" :title="connectionEndpointOf(connection)">
          <span
            v-for="(piece, pieceIndex) in highlightPieces(connectionEndpointOf(connection))"
            :key="pieceIndex"
            :class="{ hit: piece.hit }"
            >{{ piece.text }}</span
          >
        </span>
      </button>
      <div v-if="mentionMenuOpen && !filteredConnections.length" class="empty" data-test="mention-empty">
        {{ $t('agent.mentions.empty') }}
      </div>
    </div>

    <div class="composer">
      <div v-if="selectedSkill || selectedConnections.length || attachments.length" class="composer-tray">
        <div v-if="selectedSkill" class="skill-chip" data-test="skill-chip">
          <i class="chip-ico" :class="skillIcon(selectedSkill.skill)"></i>
          <span class="chip-name" :title="skillChipLabel">{{ skillChipLabel }}</span>
          <button class="chip-remove" type="button" :aria-label="$t('agent.skills.remove')" @click="clearSkill">
            <i class="el-icon-close"></i>
          </button>
        </div>
        <div
          v-for="connection in selectedConnections"
          :key="connection.id"
          class="mention-chip"
          data-test="connection-chip"
        >
          <span class="chip-dot" :class="{ off: !connectionState(connection.id) }"></span>
          <span class="chip-name" :title="connection.name"><span class="chip-at">@</span>{{ connection.name }}</span>
          <button
            class="chip-remove"
            type="button"
            :aria-label="$t('agent.mentions.remove')"
            @click="removeConnection(connection.id)"
          >
            <i class="el-icon-close"></i>
          </button>
        </div>
        <div v-if="attachments.length" class="attachments">
          <div v-for="attachment in attachments" :key="attachment.id" class="attachment">
            <img
              v-if="attachment.kind === 'image' && attachment.previewUrl"
              class="attachment-thumb"
              :src="attachment.previewUrl"
              :alt="attachment.name"
            />
            <span v-else class="attachment-ico">
              <i :class="attachmentIcon(attachment.kind)"></i>
            </span>
            <span class="attachment-text">
              <span class="attachment-name" :title="attachment.name">{{ attachment.name }}</span>
              <span class="attachment-meta"
                >{{ attachmentKindLabel(attachment.kind) }} · {{ formatSize(attachment.size) }}</span
              >
            </span>
            <button
              class="attachment-remove"
              type="button"
              :aria-label="$t('agent.attachments.remove')"
              @click="removeAttachment(attachment.id)"
            >
              <i class="el-icon-close"></i>
            </button>
          </div>
        </div>
      </div>

      <textarea
        ref="textarea"
        v-model="message"
        rows="1"
        :placeholder="$t('agent.composerPlaceholder')"
        @input="resize"
        @keydown="onKeydown"
        @keyup="onKeyup"
        @click="onCaretMoved"
        @paste="onPaste"
        @compositionstart="composing = true"
        @compositionend="onCompositionEnd"
      ></textarea>
      <div class="composer-bar">
        <button
          class="pill attach"
          :title="$t('agent.attachments.add')"
          :aria-label="$t('agent.attachments.add')"
          @click="openFilePicker"
        >
          <i class="el-icon-paperclip"></i>
        </button>
        <button
          class="pill mode"
          :class="{ 'mode-auto': permissionMode === 'auto' }"
          :title="modeLabel"
          @click.stop="toggleModeMenu"
        >
          <i class="mode-ico" :class="activePermission.icon"></i>
          <span class="mode-label">{{ modeLabel }}</span>
          <i class="caret el-icon-arrow-down"></i>
        </button>
        <button
          v-if="connectionName"
          class="pill ctx"
          :title="$t('agent.mentions.current')"
          @click="mentionCurrentConnection"
        >
          <i class="on-dot" :class="{ off: !connected }"></i>
          <span class="ctx-name" :title="connectionName"><span class="ctx-at">@</span>{{ connectionName }}</span>
        </button>
        <el-tooltip
          v-if="contextTokens > 0"
          placement="top"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          :open-delay="200"
          popper-class="agent-context-tip"
        >
          <div slot="content">
            <div>{{ contextUsageText }}</div>
            <div class="context-tip-hint">{{ contextAutoCompactText }}</div>
          </div>
          <span class="context-meter" data-test="context-meter">
            <svg class="context-ring" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <circle class="ring-track" cx="7" cy="7" r="5.5"></circle>
              <circle
                class="ring-value"
                :class="{ 'ring-warn': contextPercent >= compactPercent }"
                cx="7"
                cy="7"
                r="5.5"
                :stroke-dasharray="`${ringDash} ${ringLength}`"
              ></circle>
            </svg>
            <span class="context-percent">{{ contextPercent }}%</span>
          </span>
        </el-tooltip>
        <button class="model" :title="$t('agent.changeModel')" @click.stop="toggleModelMenu">
          <ai-provider-icon :provider="modelProvider ? modelProvider.value : ''" :model="model" />
          <span class="model-label">{{ modelLabel }}</span>
          <span v-if="showModelLevel" class="model-level">· {{ $t(levelLabel(currentReasoning)) }}</span>
          <i class="caret el-icon-arrow-down"></i>
        </button>
        <button
          v-if="isResponseStreaming"
          class="send stop"
          :aria-label="$t('agent.stop')"
          :title="$t('agent.stop')"
          @click="$emit('abort-response')"
        >
          <i></i>
        </button>
        <button
          v-else
          class="send"
          :disabled="
            (!message.trim() && attachments.length === 0 && !selectedSkill && !selectedConnections.length) || disabled
          "
          :aria-label="$t('agent.send')"
          :title="$t('agent.send')"
          @click="send"
        >
          <i class="el-icon-position"></i>
        </button>
      </div>
    </div>
    <input ref="fileInput" class="attachment-input" type="file" multiple @change="onFileInput" />
    <div class="composer-hint">{{ $t('agent.disclaimer') }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import type { PermissionMode } from '@/utils/ai/agent/approval'
import { findModelEntry, getModelLabel, getReasoningEfforts, supportsImages, supportsReasoning } from '@/utils/ai/models'
import {
  DEFAULT_AGENT_REASONING,
  effectiveReasoning,
  reasoningLabelKey,
  reasoningLevelsFor,
  type AgentReasoning,
} from '@/utils/ai/reasoning'
import { formatBytes } from '@/utils/formatter'
import { COMPACT_THRESHOLD, contextPercent as contextPercentOf, formatTokens } from '@/utils/ai/agent/contextBudget'
import {
  ATTACHMENT_HEAD_BYTES,
  AttachmentLimitError,
  OutgoingMessage,
  PendingAttachment,
  attachmentLimitError,
  classifyAttachment,
  imageMediaType,
} from '@/utils/ai/agent/attachments'
import { AgentAttachmentKind } from '@/types/agent'
import AiProviderIcon from '@/components/AiProviderIcon.vue'
import {
  AGENT_SKILLS,
  AgentSkill,
  AgentSkillName,
  SKILL_ICONS,
  filterSkills,
  renderSkillChip,
} from '@/utils/ai/agent/skills'
import {
  ConnectionMention,
  MentionQuery,
  connectionEndpoint,
  filterConnections,
  findMentionQuery,
  highlightMention,
} from '@/utils/ai/agent/mentions'

interface ComposerAttachment extends PendingAttachment {
  id: string
  previewUrl?: string
}

const KIND_KEYS: Record<AgentAttachmentKind, string> = {
  image: 'agent.attachments.kindImage',
  certificate: 'agent.attachments.kindCertificate',
  'private-key': 'agent.attachments.kindPrivateKey',
  bundle: 'agent.attachments.kindBundle',
  text: 'agent.attachments.kindText',
}

const LIMIT_KEYS: Record<AttachmentLimitError, string> = {
  'too-many-attachments': 'agent.attachments.tooManyAttachments',
  'too-many-images': 'agent.attachments.tooManyImages',
  'too-large': 'agent.attachments.tooLarge',
}

/** Electron 39 File objects have no .path; this is the supported way to get it */
const getFilePath = (file: File): string => {
  try {
    const { webUtils } = require('electron')
    return webUtils?.getPathForFile(file) || ''
  } catch {
    return ''
  }
}

@Component({ components: { AiProviderIcon } })
export default class AgentComposer extends Vue {
  @Prop({ default: '' }) readonly value!: string
  @Prop({ default: false }) readonly disabled!: boolean
  @Prop({ default: false }) readonly isResponseStreaming!: boolean
  @Prop({ default: 'ask' }) readonly permissionMode!: PermissionMode
  @Prop({ default: '' }) readonly connectionName!: string
  @Prop({ default: false }) readonly connected!: boolean
  @Prop({ default: '' }) readonly model!: string
  @Prop({ default: DEFAULT_AGENT_REASONING }) readonly agentReasoning!: AgentReasoning
  /** Connections offered by the `@` menu */
  @Prop({ default: () => [] }) readonly connections!: ConnectionMention[]
  /** Id of the connection the user is looking at; its mention is listed first */
  @Prop({ default: '' }) readonly currentConnectionId!: string
  /** Tokens in the context of the conversation on screen; 0 hides the meter */
  @Prop({ default: 0 }) readonly contextTokens!: number
  /** Context window of the model in use, in tokens */
  @Prop({ default: 0 }) readonly contextWindow!: number
  /** The token count is an estimate, not what a provider reported */
  @Prop({ default: true }) readonly contextEstimated!: boolean

  /** The theme decides which tooltip reads better on it */
  @Getter('currentTheme') private currentTheme!: string

  private message = ''
  private composing = false
  private showModeMenu = false
  private permissionModes: Array<{ mode: PermissionMode; icon: string; color?: string }> = [
    { mode: 'ask', icon: 'el-icon-lock' },
    { mode: 'auto', icon: 'el-icon-lightning', color: 'var(--agent-amber)' },
  ]
  private showModelMenu = false
  private attachments: ComposerAttachment[] = []
  private nextAttachmentId = 0
  private selectedSkill: { skill: string } | null = null
  private skillMenuOpen = false
  private skillMenuIndex = 0
  private skillMenuQuery = ''
  private mentionMenuOpen = false
  private mentionMenuIndex = 0
  private mentionQuery: MentionQuery | null = null
  private mentionDismissed = false
  private selectedConnections: Array<{ id: string; name: string }> = []

  get modelLabel(): string {
    return getModelLabel(this.model)
  }

  /** Share of the context window in use: drives both the ring and the number */
  get contextPercent(): number {
    return contextPercentOf(this.contextTokens, this.contextWindow)
  }

  /** The share the meter turns yellow at */
  get compactPercent(): number {
    return Math.round(COMPACT_THRESHOLD * 100)
  }

  /** The ring is 11px across, so this is the length of one full stroke */
  get ringLength(): number {
    return 2 * Math.PI * 5.5
  }

  get ringDash(): number {
    return (this.contextPercent / 100) * this.ringLength
  }

  /** Tooltip line one: used / window tokens, marked as an estimate when it is one */
  get contextUsageText(): string {
    const approx = this.contextEstimated ? (this.$t('agent.contextApprox') as string) : ''
    return this.$t('agent.contextUsage', {
      used: `${approx}${formatTokens(this.contextTokens)}`,
      total: formatTokens(this.contextWindow),
      percent: this.contextPercent,
    }) as string
  }

  /** Tooltip line two: when the Agent compacts the older turns on its own */
  get contextAutoCompactText(): string {
    return this.$t('agent.contextAutoCompact', { percent: this.compactPercent }) as string
  }

  /** The levels the current model offers */
  get reasoningLevels(): AgentReasoning[] {
    return reasoningLevelsFor(getReasoningEfforts(this.model))
  }

  /** The stored level as it applies to the current model, which may only offer some levels */
  get currentReasoning(): AgentReasoning {
    return effectiveReasoning(this.agentReasoning, getReasoningEfforts(this.model))
  }

  /** The strength section is only offered for models that can be asked for one */
  get showReasoning(): boolean {
    return supportsReasoning(this.model)
  }

  /** The level is shown next to the model name, except for "let the provider decide" */
  get showModelLevel(): boolean {
    return supportsReasoning(this.model) && this.currentReasoning !== DEFAULT_AGENT_REASONING
  }

  private levelLabel(level: AgentReasoning): string {
    return reasoningLabelKey(level, getReasoningEfforts(this.model))
  }

  private chooseReasoning(level: AgentReasoning) {
    this.$emit('update:agentReasoning', level)
  }

  get filteredSkills(): AgentSkill[] {
    const labels: Record<string, string> = {}
    for (const skill of AGENT_SKILLS) labels[skill.name] = this.skillLabel(skill.name)
    return filterSkills(this.skillMenuQuery, labels)
  }

  get skillChipLabel(): string {
    if (!this.selectedSkill) return ''
    return renderSkillChip(this.selectedSkill.skill, (key) => this.$t(key) as string)
  }

  created() {
    this.message = this.value
  }

  @Watch('value')
  onValueChange(value: string) {
    this.message = value
  }

  @Watch('message')
  onMessageChanged() {
    this.updateSkillMenu()
    // `message` is only updated after the model wrote it, so this is the reliable trigger while typing
    this.mentionDismissed = false
    this.syncMentionMenu()
  }

  private skillIcon(skill: AgentSkillName): string {
    return SKILL_ICONS[skill]
  }

  private skillLabel(skill: string): string {
    return this.$t(`agent.skills.${skill}.name`) as string
  }

  private skillDescription(skill: string): string {
    return this.$t(`agent.skills.${skill}.description`) as string
  }

  /** Opens the Skill menu while the input starts with `/`, and filters it with what follows */
  private updateSkillMenu() {
    if (this.message.startsWith('/')) {
      this.skillMenuQuery = this.message.slice(1)
      this.skillMenuOpen = true
      this.skillMenuIndex = 0
    } else {
      this.skillMenuOpen = false
    }
  }

  private closeSkillMenu() {
    this.skillMenuOpen = false
  }

  private applySkill(skill: string) {
    this.selectedSkill = { skill }
    // Remove the "/query" that opened the menu
    this.message = this.message.replace(/^\/\S*/, '').replace(/^\s+/, '')
    this.handleInput(this.message)
    this.closeSkillMenu()
    this.$nextTick(() => this.focus())
  }

  private clearSkill() {
    this.selectedSkill = null
  }

  private moveSkillSelection(delta: number) {
    const length = this.filteredSkills.length
    if (!length) return
    this.skillMenuIndex = (this.skillMenuIndex + delta + length) % length
  }

  private confirmSkillSelection() {
    const skill = this.filteredSkills[this.skillMenuIndex]
    if (skill) this.applySkill(skill.name)
  }

  // ---------- @ connection mentions ----------

  get filteredConnections(): ConnectionMention[] {
    return filterConnections(this.mentionQuery?.query ?? '', this.connections, this.currentConnectionId)
  }

  private connectionEndpointOf(connection: ConnectionMention): string {
    return connectionEndpoint(connection)
  }

  /** Whether the mentioned connection currently has a live client, for the chip dot */
  private connectionState(id: string): boolean {
    return this.connections.some((connection) => connection.id === id && connection.connected)
  }

  /** Splits a row's text so the part matching the typed query can be highlighted */
  private highlightPieces(text: string): Array<{ text: string; hit: boolean }> {
    return highlightMention(text, this.mentionQuery?.query ?? '')
  }

  /** Opens, filters or closes the mention menu from where the caret is */
  private syncMentionMenu() {
    // The `/` Skill menu owns the whole input, so the two menus are never open together
    if (this.skillMenuOpen || this.composing || this.mentionDismissed) {
      this.closeMentionMenu()
      return
    }
    const textarea = this.$refs.textarea as HTMLTextAreaElement | undefined
    const caret = textarea ? textarea.selectionStart : this.message.length
    const found = findMentionQuery(this.message, caret)
    if (!found) {
      this.closeMentionMenu()
      return
    }
    const queryChanged =
      !this.mentionQuery || this.mentionQuery.query !== found.query || this.mentionQuery.start !== found.start
    this.mentionQuery = found
    this.mentionMenuOpen = true
    if (queryChanged) this.mentionMenuIndex = 0
    if (this.mentionMenuIndex >= this.filteredConnections.length) this.mentionMenuIndex = 0
  }

  private closeMentionMenu() {
    this.mentionMenuOpen = false
    this.mentionQuery = null
  }

  private moveMentionSelection(delta: number) {
    const length = this.filteredConnections.length
    if (!length) return
    this.mentionMenuIndex = (this.mentionMenuIndex + delta + length) % length
    this.$nextTick(() => {
      const menu = this.$refs.mentionMenu as HTMLElement | undefined
      const selected = menu?.querySelector('.opt.sel') as HTMLElement | null
      selected?.scrollIntoView({ block: 'nearest' })
    })
  }

  private confirmMentionSelection() {
    const connection = this.filteredConnections[this.mentionMenuIndex]
    // With nothing to pick, Enter only closes the menu: it must not send the message
    if (connection) this.applyConnection(connection)
    else this.closeMentionMenu()
  }

  /** Replaces the typed `@word` with a chip; only the id and the name leave the composer */
  private applyConnection(connection: ConnectionMention) {
    const mention = this.mentionQuery
    if (mention) {
      this.message = `${this.message.slice(0, mention.start)}${this.message.slice(mention.end)}`
    }
    this.selectConnection({ id: connection.id, name: connection.name })
    this.closeMentionMenu()
    this.handleInput(this.message)
    this.focus(mention ? mention.start : undefined)
  }

  /** Adds a connection once, so mentioning the same connection twice keeps one chip */
  private selectConnection(connection: { id: string; name: string }) {
    if (!connection.id) return
    if (this.selectedConnections.some((selected) => selected.id === connection.id)) return
    this.selectedConnections.push({ ...connection })
  }

  private removeConnection(id: string) {
    this.selectedConnections = this.selectedConnections.filter((connection) => connection.id !== id)
  }

  /** The "@ current connection" button mentions the connection the user is looking at */
  private mentionCurrentConnection() {
    if (!this.currentConnectionId || !this.connectionName) return
    this.selectConnection({ id: this.currentConnectionId, name: this.connectionName })
    this.closeMenus()
  }

  /** The `@word` is only complete once the IME composition ended */
  private onCompositionEnd() {
    this.composing = false
    this.$nextTick(() => this.syncMentionMenu())
  }

  /** A click moves the caret, and the document click closes menus first: re-sync after it */
  private onCaretMoved() {
    this.$nextTick(() => this.syncMentionMenu())
  }

  /**
   * The keyup that follows an Escape must not reopen the menu the user just dismissed; any other
   * caret move (arrows, Home/End) re-syncs it.
   */
  private onKeyup() {
    if (this.mentionDismissed) {
      this.mentionDismissed = false
      return
    }
    this.syncMentionMenu()
  }

  private onKeydown(event: KeyboardEvent) {
    if (this.skillMenuOpen && this.filteredSkills.length) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.moveSkillSelection(1)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.moveSkillSelection(-1)
        return
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey && !this.composing && !event.isComposing)) {
        event.preventDefault()
        this.confirmSkillSelection()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        this.closeSkillMenu()
        return
      }
    }
    if (this.mentionMenuOpen) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.moveMentionSelection(1)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.moveMentionSelection(-1)
        return
      }
      // Enter never sends while the menu is up: it picks the row, or closes an empty menu
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey && !this.composing && !event.isComposing)) {
        event.preventDefault()
        this.confirmMentionSelection()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        this.mentionDismissed = true
        this.closeMentionMenu()
        return
      }
    }
    if (event.key === 'Enter') this.handleEnterKey(event)
  }

  @Emit('input')
  handleInput(value: string) {
    return value
  }

  private resize() {
    const el = this.$refs.textarea as HTMLTextAreaElement
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 186)}px`
    this.handleInput(this.message)
  }

  @Emit('send')
  send(): OutgoingMessage | '' {
    const content = this.message.replace(/\s+/g, ' ').trim()
    if (this.disabled) return ''
    if (!content && !this.attachments.length && !this.selectedSkill && !this.selectedConnections.length) return ''
    if (this.attachments.some((attachment) => attachment.kind === 'image') && !supportsImages(this.model)) {
      this.warn('agent.attachments.noVision')
      return ''
    }
    const outgoing: OutgoingMessage = {
      content,
      attachments: this.attachments.map(({ kind, name, size, mediaType, file, path }) => ({
        kind,
        name,
        size,
        mediaType,
        file,
        path,
      })),
      skill: this.selectedSkill ?? undefined,
      connections: this.selectedConnections.map((connection) => ({ ...connection })),
    }
    this.clearAttachments()
    this.selectedSkill = null
    this.selectedConnections = []
    this.closeSkillMenu()
    this.closeMentionMenu()
    this.message = ''
    this.$nextTick(() => this.resize())
    return outgoing
  }

  /** Adds files from the file picker, a paste or a drop */
  public async addFiles(files: File[]) {
    for (const file of files) {
      await this.addFile(file)
    }
  }

  private async addFile(file: File) {
    let kind: AgentAttachmentKind | null
    try {
      const head = Buffer.from(await file.slice(0, ATTACHMENT_HEAD_BYTES).arrayBuffer())
      kind = classifyAttachment(file.name, head)
    } catch {
      kind = null
    }
    if (!kind) {
      this.warn('agent.attachments.unsupported')
      return
    }
    if (kind === 'bundle') {
      this.warn('agent.attachments.bundle')
      return
    }
    if (kind === 'image' && !supportsImages(this.model)) {
      this.warn('agent.attachments.noVision')
      return
    }
    const images = this.attachments.filter((attachment) => attachment.kind === 'image').length
    const limit = attachmentLimitError(kind, file.size, { images, total: this.attachments.length })
    if (limit) {
      this.warn(LIMIT_KEYS[limit])
      return
    }
    const attachment: ComposerAttachment = {
      id: `a${this.nextAttachmentId++}`,
      kind,
      name: file.name,
      size: file.size,
      file,
    }
    if (kind === 'image') {
      attachment.mediaType = imageMediaType(file.name)
      attachment.previewUrl = URL.createObjectURL(file)
    }
    if (kind === 'certificate' || kind === 'private-key') {
      const path = getFilePath(file)
      if (!path) {
        this.warn('agent.attachments.needsFile')
        return
      }
      attachment.path = path
    }
    this.attachments.push(attachment)
  }

  private removeAttachment(id: string) {
    const index = this.attachments.findIndex((attachment) => attachment.id === id)
    if (index === -1) return
    const [removed] = this.attachments.splice(index, 1)
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
  }

  private clearAttachments() {
    for (const attachment of this.attachments) {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
    }
    this.attachments = []
  }

  private openFilePicker() {
    ;(this.$refs.fileInput as HTMLInputElement | undefined)?.click()
  }

  private onFileInput(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    this.addFiles(files)
  }

  private onPaste(event: ClipboardEvent) {
    const files = Array.from(event.clipboardData?.files ?? [])
    if (!files.length) return
    event.preventDefault()
    this.addFiles(files)
  }

  private attachmentKindLabel(kind: AgentAttachmentKind): string {
    return this.$t(KIND_KEYS[kind]) as string
  }

  /** Files, certificates and keys each get a matching icon from the app's icon fonts */
  private attachmentIcon(kind: AgentAttachmentKind): string {
    if (kind === 'certificate') return 'el-icon-lock'
    if (kind === 'private-key') return 'el-icon-key'
    return 'el-icon-document'
  }

  private formatSize(size: number): string {
    return formatBytes(size)
  }

  private warn(key: string) {
    this.$message.warning(this.$t(key) as string)
  }

  private handleEnterKey(event: KeyboardEvent) {
    if (this.composing || event.isComposing) return
    if (event.shiftKey) return
    event.preventDefault()
    if (!this.isResponseStreaming && !this.disabled) this.send()
  }

  private toggleModeMenu() {
    const open = !this.showModeMenu
    this.closeMenus()
    this.showModeMenu = open
  }

  private toggleModelMenu() {
    const open = !this.showModelMenu
    this.closeMenus()
    this.showModelMenu = open
  }

  /** All models share one API host and key, so the menu only offers the current provider's models */
  get modelProvider() {
    return findModelEntry(this.model)?.provider
  }

  get modelOptions(): { value: string; label: string }[] {
    return this.modelProvider?.children ?? []
  }

  private chooseModel(model: string) {
    this.showModelMenu = false
    this.$emit('update:model', model)
  }

  private closeMenus() {
    this.showModeMenu = false
    this.showModelMenu = false
    this.skillMenuOpen = false
    this.closeMentionMenu()
  }

  /** Closes an open menu without letting Esc reach the panel that closes the window */
  private onEsc(event: KeyboardEvent) {
    if (!this.showModeMenu && !this.showModelMenu && !this.skillMenuOpen && !this.mentionMenuOpen) return
    this.closeMenus()
    event.stopPropagation()
  }

  get activePermission(): { mode: PermissionMode; icon: string; color?: string } {
    return this.permissionModes.find((option) => option.mode === this.permissionMode) ?? this.permissionModes[0]
  }

  get modeLabel(): string {
    return this.$t(`agent.permission.${this.permissionMode}`) as string
  }

  private chooseMode(mode: PermissionMode) {
    this.showModeMenu = false
    this.$emit('update:permissionMode', mode)
  }

  public focus(caret?: number) {
    const textarea = this.$refs.textarea as HTMLTextAreaElement
    if (textarea) {
      this.$nextTick(() => {
        textarea.focus()
        const position = caret === undefined ? textarea.value.length : caret
        textarea.selectionStart = textarea.selectionEnd = position
      })
    }
  }

  mounted() {
    document.addEventListener('click', this.closeMenus)
  }

  beforeDestroy() {
    document.removeEventListener('click', this.closeMenus)
    this.clearAttachments()
  }
}
</script>
