<template>
  <div class="diff-view">
    <div class="diff-header">
      <div class="header-content">
        <h3>{{ $t('viewer.messageHistory') }}</h3>
      </div>
      <div class="message-info" v-if="currentMessage && previousMessage">
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

    <div class="diff-content-wrapper" v-if="messages.length >= 2">
      <div class="navigation-controls">
        <el-tooltip
          :effect="theme !== 'light' ? 'light' : 'dark'"
          placement="bottom"
          :open-delay="300"
          :content="$t('viewer.olderMessage')"
        >
          <button class="nav-button nav-button--prev" :disabled="!canGoToPrevious && !hasMore" @click="goToPrevious">
            <i class="el-icon-arrow-left"></i>
          </button>
        </el-tooltip>
        <el-tooltip
          :effect="theme !== 'light' ? 'light' : 'dark'"
          placement="bottom"
          :open-delay="300"
          :content="$t('viewer.newerMessage')"
        >
          <button class="nav-button nav-button--next" :disabled="!canGoToNext" @click="goToNext">
            <i class="el-icon-arrow-right"></i>
          </button>
        </el-tooltip>
        <el-tooltip
          :effect="theme !== 'light' ? 'light' : 'dark'"
          placement="bottom"
          :open-delay="300"
          :content="$t('viewer.goToLatestMessage')"
        >
          <button class="nav-button nav-button--latest" :disabled="currentIndex === 0" @click="goToLatest">
            <i class="el-icon-top"></i>
          </button>
        </el-tooltip>
      </div>

      <div class="diff-content">
        <Editor
          id="message-diff"
          lang="json"
          :value="modifiedMessage"
          :previous-value="originalMessage"
          :font-size="12"
          line-numbers="on"
          word-wrap="on"
          :disabled="true"
          mode="diff"
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
import Editor from '@/components/Editor.vue'
import { calculateTextSize } from '@/utils/data'

@Component({
  components: {
    Editor,
  },
})
export default class DiffView extends Vue {
  @Prop({ type: Array, default: () => [] }) private messages!: MessageModel[]
  @Prop({ type: Boolean, default: false }) private hasMore!: boolean
  @Getter('currentTheme') private theme!: Theme

  private currentIndex = 0

  get currentMessage(): MessageModel | null {
    return this.messages[this.currentIndex] || null
  }

  get previousMessage(): MessageModel | null {
    return this.messages[this.currentIndex + 1] || null
  }

  get canGoToPrevious(): boolean {
    return this.currentIndex < this.messages.length - 2
  }

  get canGoToNext(): boolean {
    return this.currentIndex > 0
  }

  private goToPrevious(): void {
    if (this.canGoToPrevious) {
      this.currentIndex++
    } else if (this.hasMore) {
      this.$emit('request-older')
    }
  }

  private goToNext(): void {
    if (this.canGoToNext) {
      this.currentIndex--
    }
  }

  private goToLatest(): void {
    this.currentIndex = 0
  }

  private get originalMessage(): string {
    const prev = this.previousMessage
    if (!prev || !prev.payload) return ''
    try {
      return JSON.stringify(this.parsePayload(prev.payload), null, 2)
    } catch {
      return prev.payload
    }
  }

  private get modifiedMessage(): string {
    const curr = this.currentMessage
    if (!curr || !curr.payload) return ''
    try {
      return JSON.stringify(this.parsePayload(curr.payload), null, 2)
    } catch {
      return curr.payload
    }
  }

  private parsePayload(payload: string): any {
    try {
      return JSON.parse(payload)
    } catch {
      return payload
    }
  }

  private formatTime(timeString: string): string {
    try {
      return new Date(timeString).toLocaleString()
    } catch (error) {
      return timeString
    }
  }

  private getPayloadSize(payload: string): string {
    return calculateTextSize(payload)
  }

  private handleKeydown = (e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement | null
    const isEditable =
      !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
    if (isEditable) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.goToPrevious()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.goToNext()
    }
  }

  mounted() {
    window.addEventListener('keydown', this.handleKeydown)
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown)
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
      .el-select {
        width: 100px;
      }

      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;

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
      gap: 8px;
      justify-content: center;
      padding: 0 16px;
      background: var(--color-bg-primary);
      border-bottom: 1px solid var(--color-border-default);
      height: 57px; // Match .message-header height in JSONTreeView.vue

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--color-border-default);
        background: var(--color-bg-normal);
        color: var(--color-text-default);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;

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
          font-size: 10px;
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
