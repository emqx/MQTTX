<template>
  <div class="diff-view">
    <div class="diff-header">
      <div class="header-content">
        <h3>{{ $t('viewer.messageHistory') }}</h3>
      </div>
      <div class="message-info" v-if="currentMessage && previousMessage">
        <div class="info-item">
          <span class="label">Topic:</span>
          <span class="value">{{ currentMessage.topic }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('viewer.previous') }}</span>
          <span class="value">{{ formatTime(previousMessage.createAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('viewer.currentLabel') }}</span>
          <span class="value">{{ formatTime(currentMessage.createAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">QoS:</span>
          <span class="value">{{ currentMessage.qos }}</span>
        </div>
        <div class="info-item">
          <span class="label">Retain:</span>
          <span class="value">{{ currentMessage.retain ? $t('viewer.yes') : $t('viewer.no') }}</span>
        </div>
        <div class="info-item">
          <span class="label">Size:</span>
          <span class="value">{{ getPayloadSize(currentMessage.payload) }}</span>
        </div>
      </div>
    </div>

    <div class="diff-content-wrapper" v-if="messages.length > 1">
      <div class="navigation-controls">
        <button
          class="nav-button nav-button--prev"
          :disabled="loadingMore"
          @click="goToPrevious"
          :title="$t('viewer.olderMessage')"
        >
          <i v-if="loadingMore" class="el-icon-loading"></i>
          <i v-else class="el-icon-arrow-left"></i>
        </button>
        <button
          class="nav-button nav-button--next"
          :disabled="loadingMore"
          @click="onNextClicked"
          :title="$t('viewer.newerMessage')"
        >
          <i v-if="loadingMore" class="el-icon-loading"></i>
          <i v-else class="el-icon-arrow-right"></i>
        </button>
        <button
          class="nav-button nav-button--latest"
          :disabled="loadingMore"
          @click="goToLatest"
          :title="$t('viewer.goToLatestMessage')"
        >
          <i class="el-icon-top"></i>
        </button>
      </div>

      <div class="diff-content">
        <DiffEditor
          id="message-diff"
          lang="json"
          :original-value="originalMessage"
          :modified-value="modifiedMessage"
          :font-size="12"
          line-numbers="on"
          word-wrap="on"
          :disabled="true"
          @change="onDiffChange"
          @format="onFormat"
        />
      </div>
    </div>

    <div class="no-messages" v-else>
      <p>{{ $t('viewer.selectTopicWithMessages') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import DiffEditor from '@/components/DiffEditor.vue'

@Component({
  components: {
    DiffEditor,
  },
})
export default class DiffView extends Vue {
  @Prop({ type: Array, default: () => [] }) private messages!: MessageModel[]
  @Prop({ type: Function, default: null }) private loadMore!: () => Promise<void>
  @Prop({ type: Boolean, default: false }) private hasMore!: boolean
  @Getter('currentTheme') private theme!: Theme

  private currentIndex = 0
  private originalMessage = ''
  private modifiedMessage = ''
  private loadingMore = false

  get currentMessage(): MessageModel | null {
    return this.messages[this.currentIndex] || null
  }

  get previousMessage(): MessageModel | null {
    return this.messages[this.currentIndex + 1] || null
  }

  @Watch('messages')
  private onMessagesChanged() {
    if (
      this.messages.length > 0 &&
      this.currentIndex === 0 &&
      this.originalMessage === '' &&
      this.modifiedMessage === ''
    ) {
      this.resetNavigation()
    }
    this.updateDiffContent()
  }

  @Watch('currentIndex')
  private onCurrentIndexChanged() {
    this.updateDiffContent()
  }

  private resetNavigation(): void {
    this.currentIndex = 0
  }

  private updateDiffContent(): void {
    if (this.messages.length < 2) {
      this.originalMessage = ''
      this.modifiedMessage = ''
      return
    }

    const current = this.currentMessage
    const previous = this.previousMessage

    if (!current || !previous) {
      this.originalMessage = ''
      this.modifiedMessage = ''
      return
    }

    const currentMessageObj = this.createMessageObject(current)
    const previousMessageObj = this.createMessageObject(previous)

    try {
      this.originalMessage = JSON.stringify(previousMessageObj.payload, null, 2)
      this.modifiedMessage = JSON.stringify(currentMessageObj.payload, null, 2)
    } catch (error) {
      this.$log.error(`Failed to format messages for diff: ${error}`)
      this.originalMessage = previous.payload
      this.modifiedMessage = current.payload
    }
  }

  private createMessageObject(message: MessageModel): any {
    return {
      id: message.id,
      topic: message.topic,
      payload: this.parsePayload(message.payload),
      qos: message.qos,
      retain: message.retain,
      out: message.out,
      createAt: message.createAt,
      color: message.color,
      properties: message.properties,
      meta: message.meta,
    }
  }

  private parsePayload(payload: string): any {
    try {
      return JSON.parse(payload)
    } catch {
      return payload
    }
  }

  private async goToPrevious(): Promise<void> {
    await this.findNextValidState('previous')
  }

  private async goToNext(): Promise<void> {
    await this.findNextValidState('next')
  }

  private goToLatest(): void {
    this.currentIndex = 0
  }

  private onDiffChange(value: string, event: any): void {
    console.log('Diff content changed:', value)
    this.modifiedMessage = value
  }

  private onFormat(): void {
    try {
      const parsed = JSON.parse(this.modifiedMessage)
      this.modifiedMessage = JSON.stringify(parsed, null, 2)
    } catch (error) {
      this.$message.error('Invalid JSON format')
    }
  }

  private formatTime(timeString: string): string {
    try {
      return new Date(timeString).toLocaleString()
    } catch (error) {
      return timeString
    }
  }

  private async onNextClicked() {
    await this.goToNext()
  }

  private getPayloadSize(payload: string): string {
    const size = new Blob([payload]).size
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  private isValidDiffState(index: number): boolean {
    if (index >= this.messages.length - 1) {
      return false
    }
    const current = this.messages[index]
    const previous = this.messages[index + 1]
    return !!(current && previous)
  }

  private async findNextValidState(direction: 'next' | 'previous'): Promise<boolean> {
    let targetIndex = direction === 'next' ? this.currentIndex - 1 : this.currentIndex + 1

    while (targetIndex >= 0 && targetIndex < this.messages.length - 1) {
      if (this.isValidDiffState(targetIndex)) {
        this.currentIndex = targetIndex
        return true
      }
      targetIndex = direction === 'next' ? targetIndex - 1 : targetIndex + 1
    }

    if (this.hasMore && this.loadMore) {
      this.loadingMore = true
      const prevLength = this.messages.length
      await this.loadMore()
      this.loadingMore = false

      if (this.messages.length > prevLength) {
        if (direction === 'previous') {
          for (let i = prevLength; i < this.messages.length - 1; i++) {
            if (this.isValidDiffState(i)) {
              this.currentIndex = i
              return true
            }
          }
        } else {
          const newMessagesCount = this.messages.length - prevLength
          const adjustedIndex = this.currentIndex + newMessagesCount
          if (adjustedIndex < this.messages.length - 1 && this.isValidDiffState(adjustedIndex)) {
            this.currentIndex = adjustedIndex
            return true
          }
        }
      }
    }

    return false
  }
}
</script>

<style lang="scss" scoped>
.diff-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-normal);
  color: var(--color-text-default);

  .diff-header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-primary);

    .header-content {
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--color-text-title);
      }
    }

    .message-info {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;

      .info-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .label {
          font-size: 12px;
          color: var(--color-text-light);
          font-weight: 500;
        }

        .value {
          font-size: 12px;
          color: var(--color-text-default);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .diff-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .navigation-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-bg-primary);
      border-bottom: 1px solid var(--color-border-default);

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-normal);
        color: var(--color-text-default);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;

        &:hover:not(:disabled) {
          background: var(--color-bg-item);
          border-color: var(--color-main-green);
          color: var(--color-main-green);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 4px var(--color-shadow-card);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: var(--color-bg-primary);
          border-color: var(--color-border-default);
          color: var(--color-text-light);
        }

        i {
          font-size: 12px;
        }
      }
    }

    .diff-content {
      flex: 1;
      min-height: 0;
      background: var(--color-bg-normal);
    }
  }

  .no-messages {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-normal);

    p {
      margin: 0;
      color: var(--color-text-light);
      font-size: 14px;
      text-align: center;
      padding: 20px;
      border: 1px dashed var(--color-border-default);
      border-radius: 8px;
      background: var(--color-bg-primary);
    }
  }
}

.theme-dark .diff-view {
  .navigation-controls {
    .nav-button {
      &:hover:not(:disabled) {
        box-shadow: 0 2px 12px rgba(52, 195, 136, 0.2);
      }
    }
  }
}

.theme-night .diff-view {
  .navigation-controls {
    .nav-button {
      &:hover:not(:disabled) {
        box-shadow: 0 2px 12px rgba(52, 195, 136, 0.3);
      }
    }
  }
}
</style>
