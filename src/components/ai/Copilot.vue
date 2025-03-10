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
        <copilot-input
          ref="copilotInput"
          v-model="currentPublishMsg"
          :disabled="isSending || isResponseStream"
          @send="sendMessage"
          @preset-change="handleInputPresetChange"
        />
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
import CopilotHeader from './CopilotHeader.vue'
import CopilotMessages from './CopilotMessages.vue'
import CopilotInput from './CopilotInput.vue'
import { streamText } from 'ai'
import { loadSystemPrompt, getModelProvider } from '@/utils/ai/copilot'
import { throttle } from 'lodash'
import ConnectionsIndex from '@/views/connections/index.vue'
import { CopilotMessage, CopilotRole, CopilotPresetPrompt, StreamError } from '@/types/copilot'

@Component({
  components: {
    CopilotHeader,
    CopilotMessages,
    CopilotInput,
  },
})
export default class Copilot extends Vue {
  @Getter('openAIAPIHost') private openAIAPIHost!: string
  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: App['model']
  @Getter('currentLang') private currentLang!: Language

  public showCopilot = false
  private page = 1
  private hasMore = true
  private isLoading = false
  private messages: CopilotMessage[] = []
  private currentPublishMsg = ''
  private isSending = false
  private isResponseStream = false
  private responseStreamText = ''
  private currPresetPrompt = ''
  private abortController: AbortController | null = null

  private systemMessage = {
    id: 'system-id',
    role: 'system',
    content: '',
  }

  /**
   * Finds the current connection record from ConnectionsDetail component
   * Returns undefined if no record is found
   */
  private getCurrentConnectionRecord(): ConnectionModel | undefined {
    if (this.$route.name !== 'ConnectionDetails' || this.$route.params.id === '0') {
      return undefined
    }
    return (this.$parent.$children.find((child: any) => child.currentConnection) as ConnectionsIndex | undefined)
      ?.currentConnection
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
    if (!(await this.checkAPIKey())) return

    const content = msg || this.currentPublishMsg
    if (!content) return

    await this.saveUserMessage(content)
    await this.generateAIResponse()
  }

  private async checkAPIKey(): Promise<boolean> {
    if (this.openAIAPIKey) return true
    try {
      await this.$confirm(this.$tc('copilot.copilotAPIKeyRequired'), this.$tc('copilot.warning'), {
        type: 'warning',
        confirmButtonText: this.$tc('copilot.goToSetting'),
      })
      this.$router.push({ name: 'Settings' })
    } catch {
      // ignore cancel
    }
    return false
  }

  private async saveUserMessage(content: string): Promise<void> {
    const { copilotService } = useServices()
    const requestMessage: CopilotMessage = {
      id: getCopilotMessageId(),
      role: 'user',
      content,
    }

    await copilotService.create(requestMessage)
    this.messages.push(requestMessage)
    this.scrollToBottom()
    this.isSending = true
    this.currentPublishMsg = ''
  }

  private buildMessageHistory(): Array<{ role: CopilotRole; content: string }> {
    return [
      {
        role: this.systemMessage.role as 'system',
        content: loadSystemPrompt(this.currentLang),
      },
      ...this.messages.slice(-20).map(({ role, content }) => {
        if (content.includes('@connection')) {
          const currentRecord = this.getCurrentConnectionRecord()
          content = content.replace(
            '@connection',
            currentRecord ? JSON.stringify(currentRecord) : 'No connection available',
          )
        }
        return { role, content }
      }),
    ]
  }

  private async generateAIResponse(): Promise<void> {
    const bytes = CryptoJS.AES.decrypt(this.openAIAPIKey, ENCRYPT_KEY)
    const decryptedKey = bytes.toString(CryptoJS.enc.Utf8)
    const responseMessage: CopilotMessage = {
      id: getCopilotMessageId(),
      role: 'assistant',
      content: '',
    }

    try {
      await this.streamAIResponse(decryptedKey, responseMessage)
    } catch (err) {
      this.handleAIResponseError(err)
    } finally {
      this.resetResponseState()
    }
  }

  private async streamAIResponse(apiKey: string, responseMessage: CopilotMessage): Promise<void> {
    this.responseStreamText = ''
    this.isResponseStream = true
    const throttledScroll = throttle(() => this.scrollToBottom(), 500)

    this.abortController = new AbortController()
    const { textStream } = streamText({
      model: getModelProvider({
        model: this.model,
        baseURL: this.openAIAPIHost,
        apiKey,
      }),
      temperature: 0.8,
      messages: this.buildMessageHistory(),
      abortSignal: this.abortController.signal,
      onError: this.handleStreamError,
    })

    for await (const textPart of textStream) {
      this.isSending = false
      this.responseStreamText += textPart
      this.$nextTick(throttledScroll)
    }

    responseMessage.content = this.responseStreamText
    await this.saveAndDisplayResponse(responseMessage)
  }

  private handleStreamError = ({ error }: StreamError): void => {
    this.$message.error(`API Error: ${error?.toString()}`)
    this.$log.error(`Copilot API Error: ${error?.toString()}`)
  }

  private async saveAndDisplayResponse(responseMessage: CopilotMessage): Promise<void> {
    const { copilotService } = useServices()
    await copilotService.create(responseMessage)
    this.messages.push(responseMessage)
    this.responseStreamText = ''
  }

  private handleAIResponseError(err: unknown): void {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return
    }
    const error = err as any
    this.$message.error(`API Error: ${error.toString()}`)
    this.$log.error(`Copilot API Error: ${error.toString()}`)
  }

  private resetResponseState(): void {
    this.isSending = false
    this.isResponseStream = false
    this.currPresetPrompt = ''
    this.scrollToBottom()
  }

  private async loadMessages({ reset }: { reset?: boolean } = {}) {
    if (reset === true) {
      this.messages = []
      this.page = 1
    }

    this.isLoading = true
    const { copilotService } = useServices()

    try {
      const { messages: newMessages, hasMore } = await copilotService.get(this.page)
      this.hasMore = hasMore
      this.messages = this.removeDuplicatesMessages([...(newMessages as CopilotMessage[]), ...this.messages])
      if (this.messages.length !== 0) {
        this.scrollToBottom('auto')
      }
    } finally {
      this.isLoading = false
    }
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
    const seen = new Set<string>()
    return messages.filter((message) => {
      const isDuplicate = seen.has(message.id)
      seen.add(message.id)
      return !isDuplicate
    })
  }

  private async handleInputPresetChange(data: CopilotPresetPrompt) {
    if (this.abortController) {
      this.abortController.abort()
    }

    await this.clearAllMessages()
    this.currPresetPrompt = data.prompt

    const promptValue = data.promptMap[this.currPresetPrompt]

    if (typeof promptValue === 'object' && typeof promptValue.system === 'string') {
      this.messages.push({ id: getCopilotMessageId(), role: 'system', content: promptValue.system })
    }

    const userPrompt = typeof promptValue === 'object' && 'user' in promptValue ? promptValue.user : promptValue

    if (typeof userPrompt === 'string') {
      this.currentPublishMsg = userPrompt

      const needsUserInput = [
        'emqxLogAnalysis',
        'customRequirementGenerateFunc',
        'protobufCustomRequirementGenerateSchema',
        'avroCustomRequirementGenerateSchema',
      ].includes(this.currPresetPrompt)

      if (needsUserInput) {
        this.$nextTick(() => {
          const inputComponent = this.$refs.copilotInput as Vue & { focus: () => void }
          if (inputComponent && typeof inputComponent.focus === 'function') {
            inputComponent.focus()
          }
        })
        return
      }

      this.sendMessage(this.currentPublishMsg)
    }
  }

  private created() {
    this.loadMessages({ reset: true })
  }
}
</script>

<style lang="scss">
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
  }
}
</style>
