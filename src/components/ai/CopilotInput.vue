<template>
  <div class="copilot-input footer" v-click-outside="handleClickPresetOutside">
    <transition name="el-zoom-in-bottom">
      <preset-prompt-select v-if="showPresetPrompt" ref="presetSelector" @onChange="handlePresetsChange" />
    </transition>
    <el-input
      ref="publishMsgInput"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 4 }"
      :rows="1"
      class="chat-msg-input"
      v-model="message"
      :placeholder="$t('copilot.copilotPubMsgPlaceholder')"
      @keydown.native.enter="handleEnterKey"
      @input="handleInput"
    ></el-input>
    <el-button
      class="chat-pub-btn"
      size="mini"
      :type="isResponseStreaming ? 'danger' : 'primary'"
      :icon="isResponseStreaming ? 'el-icon-video-pause' : 'el-icon-position'"
      :disabled="disabled && !isResponseStreaming"
      @click="handleButtonClick"
    >
    </el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator'
import PresetPromptSelect from './PresetPromptSelect.vue'
import ClickOutside from 'vue-click-outside'
import { CopilotPresetPrompt } from '@/types/copilot'

@Component({
  components: {
    PresetPromptSelect,
  },
  directives: {
    ClickOutside,
  },
})
export default class CopilotInput extends Vue {
  @Prop({ default: '' }) readonly value!: string
  @Prop({ default: false }) readonly disabled!: boolean
  @Prop({ default: false }) readonly isResponseStreaming!: boolean

  private message = ''

  get showPresetPrompt(): boolean {
    return this.message.startsWith('/')
  }

  created() {
    this.message = this.value
  }

  @Watch('value')
  onValueChange(newValue: string) {
    this.message = newValue
  }

  @Watch('showPresetPrompt')
  onShowPresetPromptChanged(isVisible: boolean) {
    if (isVisible) {
      this.$nextTick(() => {
        const selector = this.$refs.presetSelector as PresetPromptSelect
        selector?.focusPanel()
      })
      window.addEventListener('keydown', this.handlePresetPanelEscape)
    } else {
      window.removeEventListener('keydown', this.handlePresetPanelEscape)
    }
  }

  @Emit('input')
  handleInput(value: string) {
    return value
  }

  @Emit('send')
  sendMessage() {
    const content = this.message.replace(/\s+/g, ' ').trim()
    this.message = ''
    return content
  }

  @Emit('abort-response')
  abortResponse() {
    return
  }

  handleButtonClick() {
    if (this.isResponseStreaming) {
      this.abortResponse()
    } else {
      this.sendMessage()
    }
  }

  @Emit('preset-change')
  handlePresetsChange(prompt: string, promptMap: CopilotPresetPrompt['promptMap']) {
    this.message = prompt
    return { prompt, promptMap }
  }

  handleClickPresetOutside() {
    if (this.showPresetPrompt) {
      this.message = ''
    }
  }

  handleEnterKey(event: KeyboardEvent) {
    if (this.isResponseStreaming) {
      event.preventDefault()
      return
    }

    if (this.disabled) {
      event.preventDefault()
      return
    }

    if (!event.shiftKey && event.code === 'Enter') {
      event.preventDefault()
      this.sendMessage()
    }
  }

  handlePresetPanelEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.message = ''
      event.preventDefault()
    }
  }

  focus() {
    const inputEl = this.$refs.publishMsgInput as Vue
    if (inputEl && inputEl.$el) {
      const textarea = inputEl.$el.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        this.$nextTick(() => {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
        })
      }
    }
  }
}
</script>

<style lang="scss">
.copilot-input.footer {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  .chat-msg-input {
    flex-grow: 1;
    textarea {
      padding: 12px 48px 12px 12px;
      resize: none;
    }
  }
  .el-button.chat-pub-btn {
    position: absolute;
    right: 26px;
    padding: 0;
    width: 28px;
    height: 28px;
    min-width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    i {
      font-size: 16px;
      color: var(--color-text-active);
    }
  }
}
</style>
