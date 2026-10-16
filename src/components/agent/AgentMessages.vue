<template>
  <div ref="scroll" class="messages" role="log" aria-live="polite" @scroll="onScroll">
    <agent-welcome
      v-if="messages.length === 0 && !isSending && !streamingMessage"
      @suggest="$emit('suggest', $event)"
    />

    <div class="column conversation">
      <template v-for="message in messages">
        <div v-if="message.role === 'user'" :key="message.id" class="turn-user">
          <div class="bubble">{{ message.content }}</div>
        </div>
        <div v-else-if="message.role === 'assistant'" :key="message.id" class="turn-agent">
          <div class="avatar"><agent-avatar /></div>
          <div class="agent-content">
            <agent-thinking v-if="message.reasoning" :reasoning="message.reasoning" :is-streaming="false" />
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
              <button
                v-if="message === lastAssistant"
                class="icon-btn"
                :data-tip="$t('agent.regenerate')"
                :aria-label="$t('agent.regenerate')"
                @click="$emit('regenerate')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-if="streamingMessage" class="turn-agent">
        <div class="avatar"><agent-avatar /></div>
        <div class="agent-content">
          <agent-thinking
            v-if="streamingMessage.reasoning || isSending"
            :reasoning="streamingMessage.reasoning"
            :is-streaming="true"
          />
          <block-render
            v-for="(block, index) in blocksOf(streamingMessage)"
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </span>
        <div class="msg-text">
          <b>{{ $t('agent.requestFailed') }}</b
          >{{ errorMessage }}
        </div>
        <button class="btn" @click="$emit('retry')">{{ $t('agent.retry') }}</button>
      </div>
    </div>

    <button v-if="showJump" class="jump" :aria-label="$t('agent.jumpToLatest')" @click="jumpToBottom">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
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
import { AgentMessage } from '@/types/agent'
import AgentWelcome from './AgentWelcome.vue'
import AgentThinking from './AgentThinking.vue'
import AgentAvatar from './AgentAvatar.vue'
import BlockRender from './BlockRender.vue'

@Component({ components: { AgentWelcome, AgentThinking, AgentAvatar, BlockRender } })
export default class AgentMessages extends Vue {
  @Action('SET_INSERT_BUTTON_ADDED') private setPrismButtonAdded!: (payload: { isPrismButtonAdded: boolean }) => void
  @Getter('isPrismButtonAdded') private isPrismButtonAdded!: boolean

  @Prop({ default: () => [] }) readonly messages!: AgentMessage[]
  @Prop({ default: null }) readonly streamingMessage!: AgentMessage | null
  @Prop({ default: false }) readonly isSending!: boolean
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>
  @Prop({ default: null }) readonly errorMessage!: string | null

  private showJump = false

  get scrollEl(): HTMLElement {
    return this.$refs.scroll as HTMLElement
  }

  get lastAssistant(): AgentMessage | null {
    return [...this.messages].reverse().find((message) => message.role === 'assistant') ?? null
  }

  private blocksOf(message: AgentMessage) {
    return AgentMessages.buildBlocks(message)
  }

  /** Groups consecutive tool parts so the message renders as text / steps / approval blocks */
  static buildBlocks(message: AgentMessage): any[] {
    const blocks: any[] = []
    let steps: any[] = []
    let approval: any = null
    const flush = () => {
      if (steps.length) {
        blocks.push({ kind: 'steps', steps })
        steps = []
      }
      if (approval) {
        blocks.push({ kind: 'approval', part: approval })
        approval = null
      }
    }
    for (const part of message.parts ?? []) {
      if (part.type === 'text') {
        flush()
        if (part.text) blocks.push({ kind: 'text', content: part.text })
      } else if (part.type === 'step-limit') {
        flush()
        blocks.push({ kind: 'stepLimit', steps: part.steps })
      } else {
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
    this.$emit(
      'copy',
      (message.parts ?? [])
        .filter((p) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n\n'),
    )
  }

  @Watch('messages')
  @Watch('streamingMessage')
  onContentChange() {
    // Only auto-follow while the user is already at the bottom
    const follow = this.isNearBottom()
    this.$nextTick(() => {
      this.highlightCode()
      if (follow) this.scrollToBottom('smooth')
    })
  }

  private highlightCode() {
    if (this.scrollEl) Prism.highlightAllUnder(this.scrollEl)
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
