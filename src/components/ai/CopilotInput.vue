<template>
  <div class="copilot-input footer" v-click-outside="handleClickPresetOutside">
    <transition name="el-zoom-in-bottom">
      <preset-prompt-select v-if="showPresetPrompt" @onChange="handlePresetsChange" />
    </transition>
    <el-input
      ref="publishMsgInput"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 4 }"
      :rows="1"
      class="chat-msg-input"
      v-model="message"
      :placeholder="$t('copilot.copiltePubMsgPlacehoder')"
      @keydown.native.enter="handleEnterKey"
      @focus="handleFocus"
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

  private showPresetPrompt = false
  private message = ''
  private shouldShowPresetOnFocus = true

  created() {
    this.message = this.value
  }

  @Watch('value')
  onValueChange(newValue: string) {
    this.message = newValue
  }

  @Emit('input')
  handleInput(value: string) {
    this.showPresetPrompt = false
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
    this.showPresetPrompt = false
    this.shouldShowPresetOnFocus = false
    return { prompt, promptMap }
  }

  handleClickPresetOutside() {
    this.showPresetPrompt = false
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

  handleFocus() {
    if (this.shouldShowPresetOnFocus) {
      this.showPresetPrompt = true
    } else {
      this.shouldShowPresetOnFocus = true
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
