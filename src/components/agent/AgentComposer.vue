<template>
  <div class="composer-wrap">
    <div class="menu" :class="{ show: showModeMenu }">
      <button class="opt" :class="{ sel: permissionMode === 'ask' }" @click="chooseMode('ask')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <div class="t">{{ $t('agent.permission.ask') }}</div>
          <div class="d">{{ $t('agent.permission.askDescription') }}</div>
        </div>
        <span class="check">✓</span>
      </button>
      <button class="opt" :class="{ sel: permissionMode === 'auto' }" @click="chooseMode('auto')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--agent-amber)" stroke-width="1.8">
          <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
        </svg>
        <div>
          <div class="t">{{ $t('agent.permission.auto') }}</div>
          <div class="d">{{ $t('agent.permission.autoDescription') }}</div>
        </div>
        <span class="check">✓</span>
      </button>
    </div>

    <transition name="el-zoom-in-bottom">
      <preset-prompt-select v-if="showPresetPrompt" ref="presetSelector" @onChange="handlePresetsChange" />
    </transition>

    <div class="composer">
      <textarea
        ref="textarea"
        v-model="message"
        rows="1"
        :placeholder="$t('agent.composerPlaceholder')"
        @input="resize"
        @keydown.enter="handleEnterKey"
        @keydown.esc="showModeMenu = false"
        @compositionstart="composing = true"
        @compositionend="composing = false"
      ></textarea>
      <div class="composer-bar">
        <button
          class="pill mode"
          :class="{ 'mode-auto': permissionMode === 'auto' }"
          :title="modeLabel"
          @click.stop="toggleModeMenu"
        >
          <svg
            v-if="permissionMode === 'ask'"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
          </svg>
          <span class="mode-label">{{ modeLabel }}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button v-if="connectionName" class="pill ctx" :title="$t('agent.insertConnection')" @click="insertConnection">
          <i class="on-dot" :class="{ off: !connected }"></i>
          <span>@ {{ connectionName }}</span>
        </button>
        <button class="model" :title="$t('agent.changeModel')" @click="$emit('open-settings')">{{ model }}</button>
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
          :disabled="!message.trim() || disabled"
          :aria-label="$t('agent.send')"
          :title="$t('agent.send')"
          @click="send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
    <div class="composer-hint">{{ $t('agent.disclaimer') }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import PresetPromptSelect from './PresetPromptSelect.vue'
import { AgentPresetPrompt } from '@/types/agent'
import type { PermissionMode } from '@/utils/ai/agent/approval'

@Component({ components: { PresetPromptSelect } })
export default class AgentComposer extends Vue {
  @Prop({ default: '' }) readonly value!: string
  @Prop({ default: false }) readonly disabled!: boolean
  @Prop({ default: false }) readonly isResponseStreaming!: boolean
  @Prop({ default: 'ask' }) readonly permissionMode!: PermissionMode
  @Prop({ default: '' }) readonly connectionName!: string
  @Prop({ default: false }) readonly connected!: boolean
  @Prop({ default: '' }) readonly model!: string
  @Prop({ default: false }) readonly autoConfirmed!: boolean

  private message = ''
  private composing = false
  private showModeMenu = false

  get showPresetPrompt(): boolean {
    return this.message.startsWith('/')
  }

  created() {
    this.message = this.value
  }

  @Watch('value')
  onValueChange(value: string) {
    this.message = value
  }

  @Watch('showPresetPrompt')
  onShowPresetPromptChanged(visible: boolean) {
    if (visible) {
      this.$nextTick(() => (this.$refs.presetSelector as PresetPromptSelect | undefined)?.focusPanel())
      window.addEventListener('keydown', this.handlePresetPanelEscape)
    } else {
      window.removeEventListener('keydown', this.handlePresetPanelEscape)
    }
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
  send() {
    const content = this.message.replace(/\s+/g, ' ').trim()
    if (!content || this.disabled) return ''
    this.message = ''
    this.$nextTick(() => this.resize())
    return content
  }

  private handleEnterKey(event: KeyboardEvent) {
    if (this.composing || event.isComposing) return
    if (event.shiftKey) return
    event.preventDefault()
    if (!this.isResponseStreaming && !this.disabled) this.send()
  }

  private toggleModeMenu() {
    this.showModeMenu = !this.showModeMenu
  }

  get modeLabel(): string {
    return (
      this.permissionMode === 'auto' ? this.$t('agent.permission.auto') : this.$t('agent.permission.ask')
    ) as string
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

  @Emit('preset-change')
  handlePresetsChange(prompt: string, promptMap: AgentPresetPrompt['promptMap']) {
    this.message = prompt
    return { prompt, promptMap }
  }

  handlePresetPanelEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.message = ''
      event.preventDefault()
    }
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

  beforeDestroy() {
    window.removeEventListener('keydown', this.handlePresetPanelEscape)
  }
}
</script>
