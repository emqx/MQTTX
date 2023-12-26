<template>
  <div class="right-panel">
    <transition name="pop">
      <el-card v-show="showCopilot" id="copilot" class="copilot" shadow="never">
        <div slot="header" class="clearfix">
          <span>MQTTX Copilot <el-tag size="mini" type="info">Beta</el-tag></span>
          <div>
            <el-button type="text" @click="clearAllMessages"><i class="el-icon-delete"></i></el-button>
            <el-button type="text" @click="toggleWindow"><i class="el-icon-close"></i></el-button>
          </div>
        </div>
        <div ref="chatBody" class="chat-body">
          <!-- The final messages -->
          <div class="message-block" v-for="message in messages" :key="message.id">
            <p>
              <span class="chat-title">
                <i :class="[message.role === 'user' ? 'el-icon-user' : 'el-icon-magic-stick']"></i>
                {{ roleMap[message.role] }}
              </span>
              <vue-markdown
                class="chat-content"
                :data-prismjs-copy="$t('common.copy')"
                :data-prismjs-copy-error="$t('common.copyFailed')"
                :data-prismjs-copy-success="$t('common.copied')"
                :data-prismjs-line-numbers="true"
                data-download-link
                data-download-link-label="Download this file"
                :source="message.content"
                :anchor-attributes="{ target: '_blank' }"
              />
            </p>
            <el-divider></el-divider>
          </div>
          <div v-if="isSending" class="thinking">
            <span class="chat-title"><i class="el-icon-loading"></i>{{ $t('common.thinking') }}</span>
          </div>
          <!-- Only Show the response stream text -->
          <div v-if="responseStreamText">
            <span class="chat-title">
              <i class="el-icon-magic-stick"></i>
              <span>MQTTX Copilot</span>
            </span>
            <vue-markdown class="chat-content" :source="responseStreamText" />
            <el-divider></el-divider>
          </div>
        </div>
        <div class="footer" v-click-outside="handleClickPresetOutside">
          <transition name="el-zoom-in-bottom">
            <preset-prompt-select v-if="showPresetPrompt" @onChange="handlePresetsChange" />
          </transition>
          <el-input
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :rows="1"
            class="chat-msg-input"
            v-model="currentPublishMsg"
            :placeholder="$t('common.copiltePubMsgPlacehoder')"
            @keydown.native.enter="handleEnterKey"
            @focus="showPresetPrompt = true"
            @input="showPresetPrompt = false"
          ></el-input>
          <el-button
            class="chat-pub-btn"
            size="mini"
            type="primary"
            icon="el-icon-position"
            :disabled="isSending || isResponseStream"
            @click="sendMessage()"
          >
          </el-button>
        </div>
      </el-card>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import VueMarkdown from 'vue-markdown'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY, getCopilotMessageId } from '@/utils/idGenerator'
import useServices from '@/database/useServices'
import ClickOutside from 'vue-click-outside'
import VueI18n from 'vue-i18n'
import PresetPromptSelect from './PresetPromptSelect.vue'
import { processStream, SYSTEM_PROMPT } from '@/utils/copilot'
import { throttle } from 'lodash'

import Prism from 'prismjs'
import 'prismjs/plugins/toolbar/prism-toolbar.min'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min'
import { ipcRenderer } from 'electron'

@Component({
  components: {
    VueMarkdown,
    PresetPromptSelect,
  },
  directives: {
    ClickOutside,
  },
})
export default class Copilot extends Vue {
  @Prop({}) public record?: ConnectionModel
  @Prop({ required: true }) public mode!: 'connections' | 'scripts' | 'help'
  @Action('SET_INSERT_BUTTON_ADDED') private setisPrismButtonAdded!: (payload: { isPrismButtonAdded: boolean }) => void

  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: AIModel
  @Getter('isPrismButtonAdded') private isPrismButtonAdded!: boolean

  public showCopilot = false
  public showPresetPrompt = false
  private page = 1
  private hasMore = true
  private isLoading = false
  private messages: CopilotMessage[] = []
  private systemMessages: CopilotMessage[] = [
    {
      id: 'system-id',
      role: 'system',
      content: SYSTEM_PROMPT,
    },
  ]
  private currentPublishMsg = ''
  private isSending = false
  private isResponseStream = false
  private roleMap = {
    user: this.$tc('common.copilteUser'),
    assistant: 'MQTTX Copilot',
  }
  private responseStreamText = ''

  private currPresetPrompt = ''

  @Watch('showCopilot')
  private handleShowCopilotChange(newValue: boolean, oldValue: boolean) {
    if (newValue === true && oldValue === false && this.isSending === false) {
      this.loadMessages({ reset: true })
    }
    this.$nextTick(() => {
      setTimeout(() => {
        Prism.highlightAllUnder(this.$refs.chatBody as HTMLElement)
        this.scrollToBottom()
      }, 100)
    })
  }

  private getChatBodyRef() {
    return this.$refs.chatBody as HTMLElement
  }

  private async scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    await this.$nextTick()
    const container = this.getChatBodyRef()
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        left: 0,
        behavior,
      })
    }
  }

  private toggleWindow() {
    this.showCopilot = !this.showCopilot
  }

  public async sendMessage(msg?: string) {
    if (!this.openAIAPIKey) {
      try {
        await this.$confirm(this.$tc('common.copilotAPIKeyRequired'), this.$tc('common.warning'), {
          type: 'warning',
          confirmButtonText: this.$tc('common.goToSetting'),
        })
        this.$router.push({ name: 'Settings' })
      } catch (error) {
        // The user canceled the action
      }
      return
    }

    const content = (msg || this.currentPublishMsg).replace(/\s+/g, ' ').trim()
    if (!content) return

    const { copilotService } = useServices()
    const requestMessage: CopilotMessage = { id: getCopilotMessageId(), role: 'user', content }
    await copilotService.create(requestMessage)
    this.messages.push(requestMessage)
    this.scrollToBottom()
    this.isSending = true

    const userMessages = [
      ...this.systemMessages.map(({ role, content }) => ({ role, content })),
      ...this.messages.slice(-20).map(({ role, content }) => {
        if (content.includes('@connection')) {
          content = content.replace('@connection', JSON.stringify(this.record))
        }
        return { role, content }
      }),
    ]

    this.currentPublishMsg = ''
    const bytes = CryptoJS.AES.decrypt(this.openAIAPIKey, ENCRYPT_KEY)
    const decryptedKey = bytes.toString(CryptoJS.enc.Utf8)

    try {
      // Response message
      const responseMessage = {
        id: getCopilotMessageId(),
        role: 'assistant',
        content: '',
      } as CopilotMessage
      this.responseStreamText = ''

      // Send request to OpenAI
      const requestData = JSON.stringify({
        model: this.model,
        temperature: 0.8,
        messages: userMessages,
        stream: true,
      })
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${decryptedKey}`,
        },
        body: requestData,
      }

      this.isResponseStream = true
      const response = await fetch('https://api.openai.com/v1/chat/completions', fetchOptions)
      if (response && response.status === 200 && response.ok) {
        this.isSending = false
        const throttledScroll = throttle(() => {
          this.scrollToBottom()
        }, 500)
        const done = await processStream(response, (chunkStr) => {
          this.responseStreamText += chunkStr
          this.$nextTick(() => {
            Prism.highlightAllUnder(this.$refs.chatBody as HTMLElement)
            throttledScroll()
          })
        })
        if (done) {
          responseMessage.content = this.responseStreamText
          await copilotService.create(responseMessage)
          this.messages.push(responseMessage)
          this.responseStreamText = ''
          this.$nextTick(() => {
            Prism.highlightAllUnder(this.$refs.chatBody as HTMLElement)
          })
        }
      } else {
        const jsonResponse = await response.json()
        let errorMsg = ''
        if (jsonResponse && jsonResponse.error) {
          const { error } = jsonResponse
          errorMsg = error.message || 'Network Error'
        } else {
          errorMsg = response.statusText || 'Network Error'
        }
        this.$message.error(`API Error: ${errorMsg}`)
        this.$log.error(`Copilot API Error: ${errorMsg}`)
      }
    } catch (err) {
      const error = err as unknown as any
      console.error(error)
    } finally {
      this.isSending = false
      this.isResponseStream = false
      this.currPresetPrompt = ''
      this.scrollToBottom()
    }
  }

  private async loadMessages({ reset }: { reset?: boolean } = {}) {
    if (reset === true) {
      this.messages = []
      this.page = 1
    }
    this.isLoading = true
    const { copilotService } = useServices()
    const { messages: newMessages, hasMore } = await copilotService.get(this.page)
    this.hasMore = hasMore
    const allMessages = [...(newMessages as CopilotMessage[]), ...this.messages]
    this.messages = this.removeDuplicatesMessages(allMessages)
    if (this.messages.length === 0) {
      this.messages.push({ id: getCopilotMessageId(), role: 'assistant', content: this.$tc('common.welcomeToCopilot') })
    } else {
      this.scrollToBottom('auto')
    }
    this.isLoading = false
  }

  private async clearAllMessages() {
    this.responseStreamText = ''
    const { copilotService } = useServices()
    await copilotService.deleteAll()
    this.loadMessages({ reset: true })
  }

  private handleTopScroll(e: Event) {
    if (this.hasMore === false) {
      return
    }
    const target = e.target as HTMLElement
    if (target.scrollTop === 0 && !this.isLoading) {
      this.page += 1
      this.loadMessages()
    }
  }

  private removeDuplicatesMessages(messages: CopilotMessage[]): CopilotMessage[] {
    const seen = new Set()
    return messages.filter((message) => {
      const duplicate = seen.has(message.id)
      seen.add(message.id)
      return !duplicate
    })
  }

  private handlePresetsChange(prompts: string[], promptMap: Record<string, string | VueI18n.TranslateResult>) {
    this.currPresetPrompt = prompts[prompts.length - 1]
    const sendMessage = promptMap[this.currPresetPrompt]
    this.sendMessage(sendMessage as string)
    this.showPresetPrompt = false
  }

  private handleClickPresetOutside() {
    this.showPresetPrompt = false
  }

  private handleEnterKey(event: KeyboardEvent) {
    if (this.isSending || this.isResponseStream) {
      event.preventDefault()
      return
    }
    if (!event.shiftKey && event.code === 'Enter') {
      event.preventDefault()
      this.sendMessage()
    }
  }

  private addInsertButton() {
    if (this.isPrismButtonAdded) {
      return
    }
    if (!Prism || !Prism.plugins || !Prism.plugins.toolbar) {
      return
    }
    Prism.manual = true
    Prism.plugins.toolbar.registerButton('insert-button', {
      text: this.$t('common.insertCodeToEditor'),
      onClick: ({ code }: { code: string }) => {
        ipcRenderer.send('insertCodeToEditor', code)
      },
    })
    this.setisPrismButtonAdded({ isPrismButtonAdded: true })
  }

  private created() {
    this.loadMessages({ reset: true })
  }

  private async mounted() {
    this.getChatBodyRef().addEventListener('scroll', this.handleTopScroll)
    this.addInsertButton()
  }

  private beforeDestroy() {
    this.getChatBodyRef().removeEventListener('scroll', this.handleTopScroll)
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

.right-panel {
  display: inline;
  & > div {
    box-shadow: -2px 0px 8px 0px var(--color-shadow-leftlist);
    position: fixed;
    right: 1px;
    width: 45%;
    background: var(--color-bg-normal);
    border-radius: 0;
    top: 0;
    bottom: 0;
    padding-bottom: 42px;
    color: var(--color-text-default);
  }
  .el-card {
    z-index: 5;
    height: 100%;
    .el-card__header {
      .clearfix {
        display: flex;
        align-items: center;
        justify-content: space-between;
        .el-button--text {
          padding: 0;
          i {
            font-size: 16px;
            color: var(--color-text-title);
            font-weight: 400;
          }
        }
      }
      .el-tag {
        margin-left: 8px;
      }
    }
    .el-card__body {
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      .chat-body {
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
          h1 {
            font-size: 2em;
          }
          h2 {
            font-size: 1.5em;
          }
          h3 {
            font-size: 1.25em;
          }
          h4 {
            font-size: 1em;
          }
          h5 {
            font-size: 0.875em;
          }
          h6 {
            font-size: 0.85em;
          }

          p {
            margin-top: 0;
            margin-bottom: 10px;
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
          }
          ul,
          ol {
            padding-left: 2em;
            margin-top: 0;
            margin-bottom: 10px;
          }
          li {
            margin-top: 5px;
          }
          blockquote {
            margin: 0;
            padding: 0 1em;
            border-left: 0.25em solid var(--color-border-default);
          }
        }
      }
    }
    .footer {
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
  }
}
.pop-enter-active {
  animation: leftbarPop 0.4s;
}
.pop-leave-active {
  animation: leftbarPop 0.4s reverse;
}
.right-panel {
  @keyframes leftbarPop {
    from {
      right: -45%;
    }
    to {
      right: 1px;
    }
  }
}
</style>
