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
        <span class="check">✓</span>
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
        <span class="check">✓</span>
      </button>
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

    <div class="composer">
      <div v-if="selectedSkill || attachments.length" class="composer-tray">
        <div v-if="selectedSkill" class="skill-chip" data-test="skill-chip">
          <span class="skill-chip-name">{{ skillChipLabel }}</span>
          <button class="skill-chip-remove" type="button" :aria-label="$t('agent.skills.remove')" @click="clearSkill">
            ✕
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
              ✕
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
        @paste="onPaste"
        @compositionstart="composing = true"
        @compositionend="composing = false"
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
        <button v-if="connectionName" class="pill ctx" :title="$t('agent.insertConnection')" @click="insertConnection">
          <i class="on-dot" :class="{ off: !connected }"></i>
          <span>@ {{ connectionName }}</span>
        </button>
        <button class="model" :title="$t('agent.changeModel')" @click.stop="toggleModelMenu">
          <ai-provider-icon :provider="modelProvider ? modelProvider.value : ''" :model="model" />
          <span class="model-label">{{ modelLabel }}</span>
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
          :disabled="(!message.trim() && attachments.length === 0 && !selectedSkill) || disabled"
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
import type { PermissionMode } from '@/utils/ai/agent/approval'
import { AImodelsOptions, getModelLabel, supportsImages } from '@/utils/ai/models'
import { formatBytes } from '@/utils/formatter'
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
import { AGENT_SKILLS, AgentSkill, AgentSkillName, filterSkills, renderSkillChip } from '@/utils/ai/agent/skills'

/** One Element icon set for every skill; agent.scss sizes each glyph so they look the same */
const SKILL_ICONS: Record<AgentSkillName, string> = {
  client_code: 'el-icon-edit-outline',
  payload: 'el-icon-s-data',
  schema: 'el-icon-document',
  custom_function: 'el-icon-s-operation',
  mqtt_knowledge: 'el-icon-reading',
  mqttx_diagnostics: 'el-icon-first-aid-kit',
  mqttx_cli: 'el-icon-monitor',
}

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

  get modelLabel(): string {
    return getModelLabel(this.model)
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
    if (!content && !this.attachments.length && !this.selectedSkill) return ''
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
    }
    this.clearAttachments()
    this.selectedSkill = null
    this.closeSkillMenu()
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
    return AImodelsOptions.find((provider) => provider.children.some((child) => child.value === this.model))
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
  }

  /** Closes an open menu without letting Esc reach the panel that closes the window */
  private onEsc(event: KeyboardEvent) {
    if (!this.showModeMenu && !this.showModelMenu && !this.skillMenuOpen) return
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

  private insertConnection() {
    if (!this.message.includes('@connection')) {
      this.message = `${this.message}${this.message ? ' ' : ''}@connection`
    }
    this.handleInput(this.message)
  }

  public focus() {
    const textarea = this.$refs.textarea as HTMLTextAreaElement
    if (textarea) {
      this.$nextTick(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length
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
