<template>
  <div ref="scroll" class="messages" role="log" aria-live="polite" @scroll="onScroll">
    <agent-welcome
      v-if="messages.length === 0 && !isSending && !streamingMessage"
      @suggest="$emit('suggest', $event)"
    />

    <div class="column conversation">
      <template v-for="message in messages">
        <div v-if="message.role === 'user'" :key="message.id" class="turn-user">
          <div class="user-message">
            <div v-if="skillsOf(message).length" class="user-skills">
              <span
                v-for="(skill, skillIndex) in skillsOf(message)"
                :key="skillIndex"
                class="user-skill"
                data-test="skill-chip"
              >
                <i class="chip-ico" :class="skillIcon(skill)"></i>
                <span class="chip-name" :title="skillChipLabel(skill)">{{ skillChipLabel(skill) }}</span>
              </span>
            </div>
            <div v-if="connectionsOf(message).length" class="user-skills">
              <span
                v-for="(connection, connectionIndex) in connectionsOf(message)"
                :key="connectionIndex"
                class="user-mention"
                :class="{ openable: connectionExists(connection), gone: !connectionExists(connection) }"
                :title="connectionExists(connection) ? '' : $t('agent.mentions.gone')"
                data-test="connection-chip"
                @click="openConnection(connection)"
              >
                <span class="chip-dot" :class="{ off: !connectionConnected(connection) }"></span>
                <span class="chip-name" :title="connectionChipLabel(connection)"
                  ><span class="chip-at">@</span>{{ connectionChipLabel(connection) }}</span
                >
              </span>
            </div>
            <div v-if="attachmentsOf(message).length" class="user-attachments">
              <template v-for="(attachment, attachmentIndex) in attachmentsOf(message)">
                <img
                  v-if="attachment.kind === 'image' && imageUrl(attachment)"
                  :key="attachmentIndex"
                  class="user-image"
                  :src="imageUrl(attachment)"
                  :alt="attachment.name"
                  @click="openImage(attachment)"
                />
                <span v-else-if="attachment.kind === 'image'" :key="attachmentIndex" class="user-image-missing">{{
                  $t('agent.fileCard.missing')
                }}</span>
                <span
                  v-else
                  :key="attachmentIndex"
                  class="user-file"
                  :class="`kind-${attachment.kind}`"
                  :title="attachment.path || attachment.name"
                >
                  <span class="user-file-name">{{ attachment.name }}</span>
                  <span class="user-file-size">{{ formatSize(attachment.size) }}</span>
                </span>
              </template>
            </div>
            <div v-if="message.content" class="bubble">{{ message.content }}</div>
          </div>
        </div>
        <div v-else-if="message.role === 'assistant'" :key="message.id" class="turn-agent">
          <div class="avatar"><agent-icon :size="16" colored /></div>
          <div class="agent-content">
            <block-render
              v-for="(block, index) in blocksOf(message)"
              :key="index"
              :block="block"
              :connection-names="connectionNames"
              @approve="$emit('approve', $event)"
              @continue="$emit('continue')"
              @view="$emit('view', $event)"
            />
            <div class="msg-actions">
              <button
                class="icon-btn"
                :data-tip="$t('agent.copy')"
                :aria-label="$t('agent.copy')"
                @click="copy(message)"
              >
                <i class="iconfont icon-copy"></i>
              </button>
              <button
                v-if="message === lastAssistant"
                class="icon-btn"
                :data-tip="$t('agent.regenerate')"
                :aria-label="$t('agent.regenerate')"
                @click="$emit('regenerate')"
              >
                <i class="iconfont icon-refresh"></i>
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="compactionOf(message)" :key="message.id" class="compaction" data-test="compaction">
          <button
            class="compaction-head"
            :aria-expanded="expandedCompaction === message.id"
            @click="toggleCompaction(message.id)"
          >
            <span class="rule"></span>
            <span class="label">
              {{ $t('agent.compacted') }}
              <i :class="expandedCompaction === message.id ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
            </span>
            <span class="rule"></span>
          </button>
          <p v-if="expandedCompaction === message.id" class="compaction-summary">{{ compactionOf(message).summary }}</p>
        </div>
      </template>

      <div v-if="compacting" class="turn-agent" data-test="compacting">
        <div class="avatar"><agent-icon :size="16" colored /></div>
        <div class="agent-content">
          <div class="thinking">
            <i class="el-icon-loading"></i>
            <span>{{ $t('agent.compacting') }}</span>
          </div>
        </div>
      </div>

      <div v-if="streamingMessage" class="turn-agent">
        <div class="avatar"><agent-icon :size="16" colored /></div>
        <div class="agent-content">
          <agent-thinking
            v-if="isSending && !hasReasoningPart(streamingMessage)"
            :reasoning="''"
            :is-streaming="true"
          />
          <block-render
            v-for="(block, index) in blocksOf(streamingMessage, true)"
            :key="index"
            :block="block"
            :connection-names="connectionNames"
            @approve="$emit('approve', $event)"
            @continue="$emit('continue')"
            @view="$emit('view', $event)"
          />
        </div>
      </div>

      <div v-if="errorMessage" class="error-block">
        <span class="ico">
          <i class="el-icon-warning-outline"></i>
        </span>
        <div class="msg-text">
          <b>{{ $t('agent.requestFailed') }}</b
          >{{ errorMessage }}
        </div>
        <button class="btn" @click="$emit('retry')">{{ $t('agent.retry') }}</button>
      </div>
    </div>

    <button v-if="showJump" class="jump" :aria-label="$t('agent.jumpToLatest')" @click="jumpToBottom">
      <i class="el-icon-arrow-down"></i>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import Prism from 'prismjs'
import 'prismjs/plugins/toolbar/prism-toolbar.min'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min'
import { ipcRenderer } from 'electron'
import fs from 'fs'
import { shell } from '@electron/remote'
import {
  AgentAttachmentPart,
  AgentCompactionPart,
  AgentConnectionPart,
  AgentMessage,
  AgentSkillPart,
} from '@/types/agent'
import { formatBytes } from '@/utils/formatter'
import { resolveArchiveSync } from '@/utils/ai/agent/files'
import { AgentSkillName, SKILL_ICONS, renderSkillChip } from '@/utils/ai/agent/skills'
import { isConnectionConnected } from '@/utils/ai/agent/mentions'
import { compactionPartOf, getPartsText } from '@/utils/ai/agent/messageParts'
import AgentWelcome from './AgentWelcome.vue'
import AgentThinking from './AgentThinking.vue'
import AgentIcon from './AgentIcon.vue'
import BlockRender from './BlockRender.vue'

@Component({ components: { AgentWelcome, AgentThinking, AgentIcon, BlockRender } })
export default class AgentMessages extends Vue {
  @Action('SET_INSERT_BUTTON_ADDED') private setPrismButtonAdded!: (payload: { isPrismButtonAdded: boolean }) => void
  @Getter('isPrismButtonAdded') private isPrismButtonAdded!: boolean
  /** Live client per connection id, for the state dot of a mentioned connection */
  @Getter('activeConnection') private activeConnection!: ActiveConnection

  @Prop({ default: () => [] }) readonly messages!: AgentMessage[]
  @Prop({ default: null }) readonly streamingMessage!: AgentMessage | null
  @Prop({ default: false }) readonly isSending!: boolean
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>
  @Prop({ default: null }) readonly errorMessage!: string | null
  /** A summary of the older turns is being written before the reply starts */
  @Prop({ default: false }) readonly compacting!: boolean

  private showJump = false
  private imageUrls: Record<string, string> = {}
  /** Id of the compaction summary the user expanded */
  private expandedCompaction: string | null = null

  private compactionOf(message: AgentMessage): AgentCompactionPart | undefined {
    return compactionPartOf(message)
  }

  private toggleCompaction(id: string): void {
    this.expandedCompaction = this.expandedCompaction === id ? null : id
  }

  get scrollEl(): HTMLElement {
    return this.$refs.scroll as HTMLElement
  }

  get lastAssistant(): AgentMessage | null {
    return [...this.messages].reverse().find((message) => message.role === 'assistant') ?? null
  }

  private blocksOf(message: AgentMessage, streaming = false) {
    if (streaming) return AgentMessages.buildBlocks(message, true)
    // Historical messages never change, so their blocks are built once
    const cached = AgentMessages.blockCache.get(message)
    if (cached) return cached
    const blocks = AgentMessages.buildBlocks(message, false)
    AgentMessages.blockCache.set(message, blocks)
    return blocks
  }

  private hasReasoningPart(message: AgentMessage | null): boolean {
    return (message?.parts ?? []).some((part) => part.type === 'reasoning')
  }

  static blockCache = new WeakMap<AgentMessage, any[]>()

  /**
   * Groups consecutive tool parts so the message renders as thinking / text / steps / approval blocks.
   * A legacy message that stored the whole reply's thinking in one string gets a leading thinking block.
   */
  static buildBlocks(message: AgentMessage, streaming = false): any[] {
    const blocks: any[] = []
    const parts = message.parts ?? []
    if (message.reasoning && !parts.some((part) => part.type === 'reasoning')) {
      blocks.push({ kind: 'reasoning', part: { text: message.reasoning }, streaming: false })
    }
    let steps: any[] = []
    let approval: any = null
    const flush = () => {
      if (steps.length) {
        // A finished save_files shows a file card right after its step group
        const saved = steps.filter((part: any) => part.toolName === 'save_files' && part.state === 'done')
        blocks.push({ kind: 'steps', steps })
        for (const part of saved) blocks.push({ kind: 'file', part })
        steps = []
      }
      if (approval) {
        blocks.push({ kind: 'approval', part: approval })
        approval = null
      }
    }
    for (const part of parts) {
      if (part.type === 'text') {
        flush()
        if (part.text) blocks.push({ kind: 'text', content: part.text })
      } else if (part.type === 'reasoning') {
        flush()
        const isLast = part === parts[parts.length - 1]
        blocks.push({ kind: 'reasoning', part, streaming: streaming && isLast && part.finishedAt === undefined })
      } else if (part.type === 'step-limit') {
        flush()
        blocks.push({ kind: 'stepLimit', steps: part.steps })
      } else if (part.type === 'tool') {
        steps.push(part)
        if (part.state === 'awaiting-approval' && !approval) approval = part
      }
    }
    flush()
    return blocks
  }

  private onScroll() {
    const el = this.scrollEl
    if (!el) return
    this.showJump = el.scrollHeight - el.scrollTop - el.clientHeight > 200
    if (el.scrollTop < 40) this.$emit('load-more')
  }

  private jumpToBottom() {
    this.scrollToBottom('smooth')
  }

  public scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const el = this.scrollEl
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
    this.showJump = false
  }

  public isNearBottom(): boolean {
    const el = this.scrollEl
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  private copy(message: AgentMessage) {
    this.$emit('copy', getPartsText(message.parts ?? []))
  }

  private attachmentsOf(message: AgentMessage): AgentAttachmentPart[] {
    return (message.parts ?? []).filter((part): part is AgentAttachmentPart => part.type === 'attachment')
  }

  private skillsOf(message: AgentMessage): AgentSkillPart[] {
    return (message.parts ?? []).filter((part): part is AgentSkillPart => part.type === 'skill')
  }

  private connectionsOf(message: AgentMessage): AgentConnectionPart[] {
    return (message.parts ?? []).filter((part): part is AgentConnectionPart => part.type === 'connection')
  }

  /** The connection still exists, so the chip can open it */
  private connectionExists(part: AgentConnectionPart): boolean {
    return Boolean(this.connectionNames[part.connectionId])
  }

  /** Live state of the mentioned connection, shown by the chip dot */
  private connectionConnected(part: AgentConnectionPart): boolean {
    return isConnectionConnected(this.activeConnection, part.connectionId)
  }

  /** The icon the `/` menu shows for this skill, so both chips look the same */
  private skillIcon(skill: AgentSkillPart): string {
    return SKILL_ICONS[skill.skill as AgentSkillName] ?? ''
  }

  /** The current name of the connection, falling back to the name stored with the message */
  private connectionChipLabel(part: AgentConnectionPart): string {
    return this.connectionNames[part.connectionId] || part.name
  }

  private openConnection(part: AgentConnectionPart) {
    if (this.connectionExists(part)) this.$emit('view', part.connectionId)
  }

  private skillChipLabel(skill: AgentSkillPart): string {
    return renderSkillChip(skill.skill, (key) => this.$t(key) as string)
  }

  private formatSize(size: number): string {
    return formatBytes(size)
  }

  private imageUrl(part: AgentAttachmentPart): string {
    return part.relativePath ? this.imageUrls[part.relativePath] ?? '' : ''
  }

  private openImage(part: AgentAttachmentPart) {
    if (!part.relativePath) return
    const filePath = resolveArchiveSync(part.relativePath)
    if (filePath) shell.openPath(filePath)
  }

  /** Loads attached images from disk into blob URLs, once per file, and releases the ones no longer shown */
  private syncImageUrls() {
    const live = new Set<string>()
    for (const message of this.messages) {
      for (const part of this.attachmentsOf(message)) {
        if (part.kind !== 'image' || !part.relativePath) continue
        live.add(part.relativePath)
        if (this.imageUrls[part.relativePath] !== undefined) continue
        const filePath = resolveArchiveSync(part.relativePath)
        let url = ''
        if (filePath) {
          try {
            const data = new Uint8Array(fs.readFileSync(filePath))
            url = URL.createObjectURL(new Blob([data], { type: part.mediaType || 'image/png' }))
          } catch {
            url = ''
          }
        }
        this.$set(this.imageUrls, part.relativePath, url)
      }
    }
    for (const path of Object.keys(this.imageUrls)) {
      if (live.has(path)) continue
      const url = this.imageUrls[path]
      if (url) URL.revokeObjectURL(url)
      this.$delete(this.imageUrls, path)
    }
  }

  private followNewContent() {
    // Only auto-follow while the user is already at the bottom
    const follow = this.isNearBottom()
    this.$nextTick(() => {
      this.highlightCode()
      if (follow) this.scrollToBottom('smooth')
    })
  }

  @Watch('messages')
  onMessagesChange() {
    this.syncImageUrls()
    this.followNewContent()
  }

  @Watch('streamingMessage')
  onStreamingChange() {
    this.followNewContent()
  }

  private highlightCode() {
    const el = this.scrollEl
    if (!el) return
    // Only new blocks need highlighting; Vue keeps the DOM of unchanged v-html
    el.querySelectorAll<HTMLElement>('code[class*="language-"]:not([data-highlighted])').forEach((code) => {
      Prism.highlightElement(code)
      code.dataset.highlighted = 'true'
    })
  }

  /** Registers the toolbar button that inserts a code block into the script editor, once per app */
  private addInsertButton() {
    if (this.isPrismButtonAdded || !Prism.plugins?.toolbar) return
    Prism.manual = true
    Prism.plugins.toolbar.registerButton('insert-button', {
      text: String(this.$t('agent.insertCodeToEditor')),
      onClick: ({ code }: { code: string }) => {
        ipcRenderer.send('insertCodeToEditor', code)
      },
    })
    this.setPrismButtonAdded({ isPrismButtonAdded: true })
  }

  mounted() {
    this.addInsertButton()
    this.highlightCode()
    this.syncImageUrls()
  }

  beforeDestroy() {
    for (const url of Object.values(this.imageUrls)) {
      if (url) URL.revokeObjectURL(url)
    }
  }
}
</script>

<style lang="scss">
body.light {
  @import '@/assets/scss/theme/custom/prism-one-light.scss';
}
body.dark,
body.night {
  @import '@/assets/scss/theme/custom/prism-one-dark.scss';
}
</style>
