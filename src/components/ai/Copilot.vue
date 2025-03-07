<template>
  <div class="right-panel">
    <transition name="pop">
      <el-card v-show="showCopilot" id="copilot" class="copilot" shadow="never">
        <copilot-header slot="header" @clear-all-messages="clearAllMessages" @toggle-window="toggleWindow" />
        <copilot-messages
          ref="copilotMessages"
          :messages="messages"
          :is-sending="isSending"
          :response-stream-text="responseStreamText"
          @load-more-messages="loadMoreMessages"
        />
        <div class="footer" v-click-outside="handleClickPresetOutside">
          <transition name="el-zoom-in-bottom">
            <preset-prompt-select v-if="showPresetPrompt" @onChange="handlePresetsChange" />
          </transition>
          <el-input
            ref="publishMsgInput"
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
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY, getCopilotMessageId } from '@/utils/idGenerator'
import useServices from '@/database/useServices'
import ClickOutside from 'vue-click-outside'
import VueI18n from 'vue-i18n'
import PresetPromptSelect from './PresetPromptSelect.vue'
import CopilotHeader from './CopilotHeader.vue'
import CopilotMessages from './CopilotMessages.vue'
import { streamText } from 'ai'
import { SYSTEM_PROMPT, getModelProvider } from '@/utils/ai/copilot'
import { throttle } from 'lodash'
import ConnectionsIndex from '@/views/connections/index.vue'

@Component({
  components: {
    PresetPromptSelect,
    CopilotHeader,
    CopilotMessages,
  },
  directives: {
    ClickOutside,
  },
})
export default class Copilot extends Vue {
  @Getter('openAIAPIHost') private openAIAPIHost!: string
  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: App['model']

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
  private responseStreamText = ''
  private currPresetPrompt = ''
  private abortController: AbortController | null = null

  /**
   * Finds the current connection record from ConnectionsDetail component
   * Returns undefined if no record is found
   */
  private getCurrentConnectionRecord(): ConnectionModel | undefined {
    if (this.$route.name !== 'ConnectionDetails' || this.$route.params.id === '0') {
      return undefined
    }
    const connectionsDetailRef = this.$parent.$children.find((child: any) => child.currentConnection) as
      | ConnectionsIndex
      | undefined
    return connectionsDetailRef ? connectionsDetailRef.currentConnection : undefined
  }

  @Watch('$route.path')
  private handleRouteChange() {
    if (this.showCopilot) {
      this.showCopilot = false
    }
  }

  @Watch('showCopilot')
  private handleShowCopilotChange(newValue: boolean, oldValue: boolean) {
    if (newValue === true && oldValue === false && this.isSending === false) {
      this.loadMessages({ reset: true })
    }
    this.$nextTick(() => {
      setTimeout(() => {
        this.scrollToBottom()
      }, 100)
    })
  }

  private scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const messagesComponent = this.$refs.copilotMessages as Vue & { scrollToBottom: (behavior: ScrollBehavior) => void }
    if (messagesComponent && typeof messagesComponent.scrollToBottom === 'function') {
      messagesComponent.scrollToBottom(behavior)
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
          // Get the current connection record if available
          const currentRecord = this.getCurrentConnectionRecord()
          content = content.replace(
            '@connection',
            currentRecord ? JSON.stringify(currentRecord) : 'No connection available',
          )
        }
        return { role, content }
      }),
    ]

    this.currentPublishMsg = ''
    const bytes = CryptoJS.AES.decrypt(this.openAIAPIKey, ENCRYPT_KEY)
    const decryptedKey = bytes.toString(CryptoJS.enc.Utf8)

    try {
      const responseMessage: CopilotMessage = {
        id: getCopilotMessageId(),
        role: 'assistant',
        content: '',
      }
      this.responseStreamText = ''
      this.isResponseStream = true
      const throttledScroll = throttle(() => {
        this.scrollToBottom()
      }, 500)
      this.abortController = new AbortController()
      const { textStream } = streamText({
        model: getModelProvider({
          model: this.model,
          baseURL: this.openAIAPIHost,
          apiKey: decryptedKey,
        }),
        temperature: 0.8,
        messages: userMessages,
        abortSignal: this.abortController.signal,
        onError: ({ error }) => {
          this.$message.error(`API Error: ${error?.toString()}`)
          this.$log.error(`Copilot API Error: ${error?.toString()}`)
        },
      })
      for await (const textPart of textStream) {
        this.isSending = false
        this.responseStreamText += textPart
        this.$nextTick(() => {
          throttledScroll()
        })
      }
      responseMessage.content = this.responseStreamText
      await copilotService.create(responseMessage)
      this.messages.push(responseMessage)
      this.responseStreamText = ''
    } catch (err) {
      const error = err as unknown as any
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Manually terminated, no record
        return
      }
      this.$message.error(`API Error: ${error.toString()}`)
      this.$log.error(`Copilot API Error: ${error.toString()}`)
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

  private loadMoreMessages() {
    if (this.hasMore && !this.isLoading) {
      this.page += 1
      this.loadMessages()
    }
  }

  private async clearAllMessages() {
    this.responseStreamText = ''
    const { copilotService } = useServices()
    await copilotService.deleteAll()
    this.loadMessages({ reset: true })
  }

  private removeDuplicatesMessages(messages: CopilotMessage[]): CopilotMessage[] {
    const seen = new Set()
    return messages.filter((message) => {
      const duplicate = seen.has(message.id)
      seen.add(message.id)
      return !duplicate
    })
  }

  private async handlePresetsChange(
    prompt: string,
    promptMap: Record<string, VueI18n.TranslateResult | Record<'system' | 'user', VueI18n.TranslateResult>>,
  ) {
    if (this.abortController) {
      this.abortController.abort()
    }
    await this.clearAllMessages()
    this.currPresetPrompt = prompt
    const promptValue = promptMap[this.currPresetPrompt]
    if (typeof promptValue === 'object' && typeof promptValue.system === 'string') {
      this.messages.push({ id: getCopilotMessageId(), role: 'system', content: promptValue.system })
    }
    const userPrompt = typeof promptValue === 'object' && 'user' in promptValue ? promptValue.user : promptValue
    if (typeof userPrompt === 'string') {
      this.currentPublishMsg = userPrompt
      if (
        [
          'emqxLogAnalysis',
          'customRequirementGenerate',
          'protobufCustomRequirementGenerateSchema',
          'avroCustomRequirementGenerateSchema',
        ].includes(this.currPresetPrompt)
      ) {
        const pubMsgRef = this.$refs.publishMsgInput as Vue
        if (pubMsgRef) {
          const input = pubMsgRef.$el.children[0] as HTMLElement
          input.focus()
          this.showPresetPrompt = false
          return
        }
      }
      this.sendMessage(this.currentPublishMsg)
      this.showPresetPrompt = false
    }
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

  private created() {
    this.loadMessages({ reset: true })
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';

.right-panel {
  display: inline;
  .pop-enter-active {
    animation: rightbarPop 0.4s;
  }
  .pop-leave-active {
    animation: rightbarPop 0.4s reverse;
  }
  @keyframes rightbarPop {
    from {
      right: -45%;
    }
    to {
      right: 0px;
    }
  }
  & > div {
    box-shadow: -2px 0px 8px 0px var(--color-shadow-leftlist);
    position: fixed;
    right: 0px;
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
    .el-card__body {
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
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
</style>
