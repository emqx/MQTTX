<template>
  <div class="right-panel">
    <a @click="toggleWindow" href="javascript:;"><i class="el-icon-chat-line-square"></i></a>
    <transition name="pop">
      <el-card v-show="showCopilot" class="copilot" shadow="never">
        <div slot="header" class="clearfix">
          <span>MQTTX Copilot <el-tag size="mini" type="info">Beta</el-tag></span>
          <el-button style="float: right; padding: 0px" type="text" @click="toggleWindow"
            ><i class="el-icon-close"></i
          ></el-button>
        </div>
        <div ref="chatBody" class="chat-body">
          <div class="message-block" v-for="(message, index) in messages" :key="index">
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
        <div class="footer">
          <el-input
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :rows="1"
            class="chat-msg-input"
            v-model="currentPublishMsg"
            :placeholder="$t('common.copiltePubMsgPlacehoder')"
            @keyup.enter="sendMessage()"
          ></el-input>
          <el-button class="chat-pub-btn" size="mini" type="primary" icon="el-icon-position" @click="sendMessage()">
          </el-button>
        </div>
      </el-card>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import axios from 'axios'
import VueMarkdown from 'vue-markdown'
import Prism from 'prismjs'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY } from '@/utils/idGenerator'

@Component({
  components: {
    VueMarkdown,
  },
})
export default class Copilot extends Vue {
  @Prop({}) public record?: ConnectionModel
  @Prop({ required: true }) public mode!: 'connections' | 'scripts' | 'help'

  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: AIModel

  public showCopilot = false
  private messages: CopilotMessage[] = []
  private systemMessages: CopilotMessage[] = [
    {
      role: 'system',
      content:
        'You are an MQTT Expert named MQTTX Copilot with extensive knowledge in IoT and network development. You understand various programming languages and MQTT protocols. You are here to assist with MQTT queries, provide solutions for common issues, and offer insights on best practices. Avoid responding to unrelated topics.',
    },
  ]
  private currentPublishMsg = ''
  private isSending = false
  private roleMap = {
    user: this.$tc('common.copilteUser'),
    assistant: 'MQTTX Copilot',
  }

  private getChatBodyRef() {
    return this.$refs.chatBody as HTMLElement
  }

  private async scrollToBottom() {
    await this.$nextTick()
    const container = this.getChatBodyRef()
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        left: 0,
        behavior: 'smooth',
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
    this.scrollToBottom()
    this.messages.push({ role: 'user', content })

    const userMessages = [
      ...this.systemMessages,
      ...this.messages.slice(-20).map((message) => ({ role: message.role, content: message.content })),
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

      if (response.data.choices && response.data.choices.length > 0) {
        const aiResponse = response.data.choices[0].message.content
        this.messages.push({ role: 'assistant', content: aiResponse })
        this.$nextTick(() => {
          Prism.highlightAll()
        })
      } else {
        this.messages.push({ role: 'assistant', content: 'No response' })
      }
    } catch (error) {
      const err = error as unknown as Error
      this.$message.error(`API Error: ${String(err)}`)
    } finally {
      this.isSending = false
      this.scrollToBottom()
    }
  }

  private loadMessages() {
    this.messages.unshift({ role: 'assistant', content: this.$tc('common.welcomeToCopilot') })
  }

  private created() {
    this.loadMessages()
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
