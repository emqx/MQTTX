<template>
  <div class="right-panel">
    <a @click="toggleWindow" href="javascript:;"><i class="el-icon-chat-line-square"></i></a>
    <transition name="pop">
      <el-card v-show="showCopilot" class="copilot" shadow="never">
        <div slot="header" class="clearfix">
          <span>MQTTX Copilot <el-tag size="mini" type="info">Beta</el-tag></span>
          <div>
            <el-button type="text" @click="clearAllMessages"><i class="el-icon-delete"></i></el-button>
            <el-button type="text" @click="toggleWindow"><i class="el-icon-close"></i></el-button>
          </div>
        </div>
        <div ref="chatBody" class="chat-body">
          <div class="message-block" v-for="message in messages" :key="message.id">
            <p>
              <span class="chat-title">
                <i :class="[message.role === 'user' ? 'el-icon-user' : 'el-icon-magic-stick']"></i>
                {{ roleMap[message.role] }}
              </span>
              <vue-markdown class="chat-content">{{ message.content }}</vue-markdown>
            </p>
            <el-divider></el-divider>
          </div>
          <div v-if="isSending" class="thinking">
            <span class="chat-title"><i class="el-icon-loading"></i>{{ $t('common.thinking') }}</span>
          </div>
        </div>
        <div class="footer" v-click-outside="handleClickPresetOutside">
          <transition name="el-zoom-in-bottom">
            <el-cascader-panel
              v-if="showPresetPrompt"
              class="preset-prompts"
              :options="presetPromptOptions"
              @change="handlePresetsChange"
            ></el-cascader-panel>
          </transition>
          <el-input
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :rows="1"
            class="chat-msg-input"
            v-model="currentPublishMsg"
            :placeholder="$t('common.copiltePubMsgPlacehoder')"
            @keyup.enter="sendMessage()"
            @focus="showPresetPrompt = true"
            @input="showPresetPrompt = false"
          ></el-input>
          <el-button
            class="chat-pub-btn"
            size="mini"
            type="primary"
            icon="el-icon-position"
            :disabled="isSending"
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
import { Getter } from 'vuex-class'
import axios from 'axios'
import VueMarkdown from 'vue-markdown'
import Prism from 'prismjs'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY, getCopilotMessageId } from '@/utils/idGenerator'
import useServices from '@/database/useServices'
import ClickOutside from 'vue-click-outside'
import VueI18n from 'vue-i18n'

@Component({
  components: {
    VueMarkdown,
  },
  directives: {
    ClickOutside,
  },
})
export default class Copilot extends Vue {
  @Prop({}) public record?: ConnectionModel
  @Prop({ required: true }) public mode!: 'connections' | 'scripts' | 'help'

  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: AIModel

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
      content:
        'You are an MQTT Expert named MQTTX Copilot and developed by EMQ with extensive knowledge in IoT and network development. You understand various programming languages and MQTT protocols. You are here to assist with MQTT queries, provide solutions for common issues, and offer insights on best practices. Avoid responding to unrelated topics.',
    },
  ]
  private currentPublishMsg = ''
  private isSending = false
  private roleMap = {
    user: this.$tc('common.copilteUser'),
    assistant: 'MQTTX Copilot',
  }

  private currPresetPrompt = ''
  get presetPromptsMap(): Record<string, string | VueI18n.TranslateResult> {
    return {
      javascript: this.$t('common.promptProgrammingLanguage', ['JavaScript', '@connection']),
      python: this.$t('common.promptProgrammingLanguage', ['Python', '@connection']),
      java: this.$t('common.promptProgrammingLanguage', ['Java', '@connection']),
      go: this.$t('common.promptProgrammingLanguage', ['Go', '@connection']),
      c: this.$t('common.promptProgrammingLanguage', ['C', '@connection']),
      cpp: this.$t('common.promptProgrammingLanguage', ['C++', '@connection']),
      csharp: this.$t('common.promptProgrammingLanguage', ['C#', '@connection']),
      php: this.$t('common.promptProgrammingLanguage', ['PHP', '@connection']),
      swift: this.$t('common.promptProgrammingLanguage', ['Swift', '@connection']),
      kotlin: this.$t('common.promptProgrammingLanguage', ['Kotlin', '@connection']),
      rust: this.$t('common.promptProgrammingLanguage', ['Rust', '@connection']),
      dart: this.$t('common.promptProgrammingLanguage', ['Dart', '@connection']),
      erlang: this.$t('common.promptProgrammingLanguage', ['Erlang', '@connection']),
      autoFillPayload: this.$t('common.promptAutoFillPayload'),
      mqttProtocol: this.$t('common.mqttProtocol'),
      installEMQX: this.$t('common.installEMQX'),
      emqxRule: this.$t('common.promptEmqxRule'),
      connectionInfo: this.$t('common.promptCurrentConnectionInfo', ['@connection']),
    }
  }
  private presetPromptOptions = [
    {
      value: 'clientCodegen',
      label: this.$tc('common.promptCodegen'),
      children: [
        {
          value: 'javascript',
          label: 'JavaScript',
        },
        {
          value: 'python',
          label: 'Python',
        },
        {
          value: 'java',
          label: 'Java',
        },
        {
          value: 'go',
          label: 'Go',
        },
        {
          value: 'c',
          label: 'C',
        },
        {
          value: 'cpp',
          label: 'C++',
        },
        {
          value: 'csharp',
          label: 'C#',
        },
        {
          value: 'php',
          label: 'PHP',
        },
        {
          value: 'swift',
          label: 'Swift',
        },
        {
          value: 'kotlin',
          label: 'Kotlin',
        },
        {
          value: 'rust',
          label: 'Rust',
        },
        {
          value: 'dart',
          label: 'Dart',
        },
        {
          value: 'erlang',
          label: 'Erlang',
        },
      ],
    },
    {
      value: 'payload',
      label: 'Payload',
      children: [
        {
          value: 'autoFillPayload',
          label: this.$tc('common.genPayload'),
        },
      ],
    },
    {
      value: 'emqx',
      label: 'EMQX',
      children: [
        {
          value: 'installEMQX',
          label: this.$t('common.installEMQX'),
        },
        {
          value: 'emqxRule',
          label: this.$t('common.emqxRule'),
        },
      ],
    },
    {
      value: 'mqtt',
      label: 'MQTT FAQs',
      children: [
        {
          value: 'mqttProtocol',
          label: this.$tc('common.mqttProtocol'),
        },
      ],
    },
    {
      value: 'explain',
      label: this.$t('common.explainer'),
      children: [
        {
          value: 'connectionInfo',
          label: this.$t('common.currentConnectionInfo'),
        },
      ],
    },
  ]

  @Watch('showCopilot')
  private handleShowCopilotChange(newValue: boolean, oldValue: boolean) {
    if (newValue === true && oldValue === false && this.isSending === false) {
      this.loadMessages({ reset: true })
    }
    this.$nextTick(() => {
      setTimeout(() => {
        Prism.highlightAll()
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
      this.$confirm(this.$tc('common.copilotAPIKeyRequired'), this.$tc('common.warning'), {
        type: 'warning',
        confirmButtonText: this.$tc('common.goToSetting'),
      })
        .then(() => {
          this.$router.push({ name: 'Settings' })
        })
        .catch(() => {
          // The user canceled the action
        })

      return
    }

    const content = (msg || this.currentPublishMsg).replace(/\s+/g, ' ').trim()
    if (!content) return

    this.isSending = true
    const { copilotService } = useServices()
    const requestMessage: CopilotMessage = { id: getCopilotMessageId(), role: 'user', content }
    await copilotService.create(requestMessage)
    this.messages.push(requestMessage)
    this.scrollToBottom()

    const userMessages = [
      ...this.systemMessages.map(({ role, content }) => ({ role, content })),
      ...this.messages.slice(-20).map(({ role, content }) => {
        if (content.includes('@connection')) {
          return { role, content: content.replace('@connection', JSON.stringify(this.record)) }
        }
        return { role, content }
      }),
    ]

    this.currentPublishMsg = ''
    const bytes = CryptoJS.AES.decrypt(this.openAIAPIKey, ENCRYPT_KEY)
    const decryptedKey = bytes.toString(CryptoJS.enc.Utf8)
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          temperature: 1.0,
          messages: userMessages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decryptedKey}`,
          },
        },
      )

      let responseMessage: CopilotMessage = {
        id: getCopilotMessageId(),
        role: 'assistant',
        content: '',
      }
      if (response.data.choices && response.data.choices.length > 0) {
        const { message } = response.data.choices[0]
        Object.assign(responseMessage, message)
      } else {
        responseMessage.content = 'No response'
      }
      this.messages.push(responseMessage)
      await copilotService.create(responseMessage)
      this.$nextTick(() => {
        Prism.highlightAll()
      })
      if (this.currPresetPrompt === 'autoFillPayload') {
        this.$emit('autoFillPayload', responseMessage.content)
      }
    } catch (err) {
      const error = err as unknown as any
      if (error.response.data) {
        this.$message.error(`API Error: ${error.response.data.error.message}`)
      } else {
        this.$message.error(`API Error: ${error}`)
      }
    } finally {
      this.isSending = false
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

  private handlePresetsChange(prompts: string[]) {
    this.currPresetPrompt = prompts[prompts.length - 1]
    const sendMessage = this.presetPromptsMap[this.currPresetPrompt]
    this.sendMessage(sendMessage as string)
    this.showPresetPrompt = false
  }

  private handleClickPresetOutside() {
    this.showPresetPrompt = false
  }

  private created() {
    this.loadMessages({ reset: true })
  }

  private async mounted() {
    this.getChatBodyRef().addEventListener('scroll', this.handleTopScroll)
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
            font-size: 16px !important;
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
      .preset-prompts.el-cascader-panel.is-bordered {
        box-shadow: #0000001a 0px 4px 12px;
        background: var(--color-bg-normal);
        position: absolute;
        bottom: 68px;
        border: 1px solid var(--color-border-default);
        .el-cascader-node.in-active-path,
        .el-cascader-node.is-selectable.in-checked-path,
        .el-cascader-node.is-active {
          font-weight: normal;
        }
        .el-cascader-node {
          padding: 0 12px 0 12px;
          .el-cascader-node__label {
            padding: 0;
            padding-right: 30px;
          }
        }
        .el-cascader-menu {
          min-width: auto;
          border-right: 1px solid var(--color-border-default);
          &:last-child {
            border-right: none;
          }
        }
        .el-cascader-menu,
        i {
          color: var(--color-text-default);
        }
        .el-icon-check.el-cascader-node__prefix {
          display: none;
        }
        .el-cascader-node:not(.is-disabled):hover,
        .el-cascader-node:not(.is-disabled):focus {
          background-color: transparent;
          color: var(--color-main-green);
        }
      }
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
