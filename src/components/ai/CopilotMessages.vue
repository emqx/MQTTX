<template>
  <div class="copilot-messages chat-body" ref="chatBody">
    <!-- Message List -->
    <template v-for="message in messages">
      <div v-if="message.role !== 'system'" class="message-block" :key="message.id">
        <p>
          <span class="chat-title">
            <i :class="[message.role === 'user' ? 'el-icon-user' : 'el-icon-magic-stick']"></i>
            {{ roleMap[message.role] }}
          </span>
          <vue-markdown
            class="chat-content"
            :data-prismjs-copy="copyText"
            :data-prismjs-copy-error="copyFailedText"
            :data-prismjs-copy-success="copiedText"
            :data-prismjs-line-numbers="true"
            data-download-link
            data-download-link-label="Download this file"
            :source="message.content"
            :anchor-attributes="{ target: '_blank' }"
          />
        </p>
        <el-divider></el-divider>
      </div>
    </template>

    <!-- Thinking Status -->
    <div v-if="isSending" class="thinking">
      <span class="chat-title"><i class="el-icon-loading"></i>{{ $t('copilot.thinking') }}</span>
    </div>

    <!-- Response Stream Text -->
    <div v-if="responseStreamText">
      <span class="chat-title">
        <i class="el-icon-magic-stick"></i>
        <span>MQTTX Copilot</span>
      </span>
      <vue-markdown class="chat-content" :source="responseStreamText" />
      <el-divider></el-divider>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import VueMarkdown from 'vue-markdown'
import Prism from 'prismjs'
import 'prismjs/plugins/toolbar/prism-toolbar.min'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min'
import { ipcRenderer } from 'electron'
import { CopilotMessage } from '@/types/copilot'

@Component({
  components: {
    VueMarkdown,
  },
})
export default class CopilotMessages extends Vue {
  @Action('SET_INSERT_BUTTON_ADDED') private setisPrismButtonAdded!: (payload: { isPrismButtonAdded: boolean }) => void
  @Getter('isPrismButtonAdded') private isPrismButtonAdded!: boolean

  @Prop({ default: () => [] }) readonly messages!: CopilotMessage[]
  @Prop({ default: false }) readonly isSending!: boolean
  @Prop({ default: '' }) readonly responseStreamText!: string

  private copyText = String(this.$t('common.copy'))
  private copyFailedText = String(this.$t('common.copyFailed'))
  private copiedText = String(this.$t('common.copied'))

  get roleMap() {
    return {
      user: this.$tc('copilot.copilteUser'),
      assistant: 'MQTTX Copilot',
      system: 'System',
    }
  }

  get chatBodyRef(): HTMLElement {
    return this.$refs.chatBody as HTMLElement
  }

  @Watch('messages')
  onMessagesChange() {
    this.$nextTick(() => {
      this.highlightCode()
      this.scrollToBottom()
    })
  }

  @Watch('responseStreamText')
  onResponseStreamTextChange() {
    this.$nextTick(() => {
      this.highlightCode()
      this.scrollToBottom()
    })
  }

  public async scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    await this.$nextTick()
    if (this.chatBodyRef) {
      this.chatBodyRef.scrollTo({
        top: this.chatBodyRef.scrollHeight,
        left: 0,
        behavior,
      })
    }
  }

  private highlightCode() {
    if (this.chatBodyRef && Prism) {
      Prism.highlightAllUnder(this.chatBodyRef)
    }
  }

  private handleTopScroll(e: Event) {
    const target = e.target as HTMLElement
    if (target.scrollTop === 0) {
      this.$emit('load-more-messages')
    }
  }

  private addInsertButton() {
    if (this.isPrismButtonAdded) {
      return
    }
    if (!Prism || !Prism.plugins || !Prism.plugins.toolbar) {
      return
    }

    const buttonText = String(this.$t('copilot.insertCodeToEditor'))

    Prism.manual = true
    Prism.plugins.toolbar.registerButton('insert-button', {
      text: buttonText,
      onClick: ({ code }: { code: string }) => {
        ipcRenderer.send('insertCodeToEditor', code)
      },
    })
    this.setisPrismButtonAdded({ isPrismButtonAdded: true })
  }

  mounted() {
    this.chatBodyRef.addEventListener('scroll', this.handleTopScroll)
    this.highlightCode()
    this.addInsertButton()
  }

  beforeDestroy() {
    this.chatBodyRef.removeEventListener('scroll', this.handleTopScroll)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';
body.light {
  @import '@/assets/scss/theme/custom/prism-one-light.scss';
}
body.dark,
body.night {
  @import '@/assets/scss/theme/custom/prism-one-dark.scss';
}

.copilot-messages {
  &.chat-body {
    flex-grow: 1;
    overflow: auto;
    overflow-x: hidden;
    overflow-y: hidden;
    padding: 16px;
    padding-bottom: 0px;
    margin-bottom: 82px;
    &:hover {
      overflow-y: overlay;
    }
    .chat-title {
      color: var(--color-text-light);
      i {
        font-size: 16px;
        margin-right: 6px;
        color: var(--color-text-light);
      }
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .chat-content {
      margin-top: 8px;
      line-height: 1.6;

      h1 {
        font-size: 2em;
        margin-top: 24px;
        margin-bottom: 16px;
      }
      h2 {
        font-size: 1.5em;
        margin-top: 20px;
        margin-bottom: 14px;
      }
      h3 {
        font-size: 1.25em;
        margin-top: 18px;
        margin-bottom: 12px;
      }
      h4 {
        font-size: 1em;
        margin-top: 16px;
        margin-bottom: 10px;
      }
      h5 {
        font-size: 0.875em;
        margin-top: 14px;
        margin-bottom: 8px;
      }
      h6 {
        font-size: 0.85em;
        margin-top: 12px;
        margin-bottom: 8px;
      }

      p {
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.6;
      }
      p,
      pre,
      code {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      code {
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 13px !important;
        padding: 2px 4px;
        border-radius: 3px;
      }
      .code-toolbar {
        margin: 16px 0;
      }
      pre {
        padding: 16px;
        border-radius: 4px;

        code {
          padding: 0;
        }
      }
      ul,
      ol {
        padding-left: 2em;
        margin-top: 0;
        margin-bottom: 16px;
      }
      li {
        margin-top: 6px;
        margin-bottom: 6px;
      }
      blockquote {
        margin: 16px 0;
        padding: 0 16px;
        color: var(--color-text-light);
        border-left: 4px solid var(--color-border-default);
      }

      table {
        margin: 16px 0;
        border-collapse: collapse;
        width: 100%;

        th,
        td {
          border: 1px solid var(--color-border-default);
          padding: 8px 12px;
        }

        th {
          background-color: var(--color-bg-primary);
          font-weight: 600;
        }
      }

      hr {
        margin: 16px 0;
        border: 0;
        border-top: 1px solid var(--color-border-default);
      }
    }

    .thinking {
      margin-bottom: 16px;
      .chat-title {
        i {
          margin-right: 8px;
        }
      }
    }

    .el-divider {
      margin: 16px 0 20px;
    }
  }
}
</style>
