<template>
  <div class="diff-view">
    <div class="diff-header" v-if="currentMessage && previousMessage">
      <el-tooltip
        :effect="theme !== 'light' ? 'light' : 'dark'"
        placement="bottom"
        :open-delay="300"
        :content="$t('viewer.olderMessage')"
      >
        <i class="nav-icon nav-left" :class="{ 'is-disabled': !canGoToPrevious && !hasMore }" @click="goToPrevious">
          <i class="el-icon-arrow-left"></i>
        </i>
      </el-tooltip>
      <div class="header-side previous">
        <span class="side-label">{{ $t('viewer.previous') }}</span>
        <span class="side-time">{{ formatTime(previousMessage.createAt) }}</span>
        <div class="side-badges">
          <span class="badge">QoS {{ previousMessage.qos }}</span>
          <span class="badge retain" v-if="previousMessage.retain">Retain</span>
          <span class="badge">{{ getPayloadSize(previousMessage.payload) }}</span>
        </div>
      </div>
      <div class="header-side current">
        <span class="side-label">{{ $t('viewer.currentLabel') }}</span>
        <span class="side-time">{{ formatTime(currentMessage.createAt) }}</span>
        <div class="side-badges">
          <span class="badge">QoS {{ currentMessage.qos }}</span>
          <span class="badge retain" v-if="currentMessage.retain">Retain</span>
          <span class="badge">{{ getPayloadSize(currentMessage.payload) }}</span>
        </div>
      </div>
      <div class="nav-right">
        <el-tooltip
          :effect="theme !== 'light' ? 'light' : 'dark'"
          placement="bottom"
          :open-delay="300"
          :content="$t('viewer.newerMessage')"
        >
          <i class="nav-icon" :class="{ 'is-disabled': !canGoToNext }" @click="goToNext">
            <i class="el-icon-arrow-right"></i>
          </i>
        </el-tooltip>
        <el-tooltip
          :effect="theme !== 'light' ? 'light' : 'dark'"
          placement="bottom"
          :open-delay="300"
          :content="$t('viewer.goToLatestMessage')"
        >
          <i class="nav-icon" :class="{ 'is-disabled': currentIndex === 0 }" @click="goToLatest">
            <i class="el-icon-d-arrow-right"></i>
          </i>
        </el-tooltip>
      </div>
    </div>

    <div class="diff-content-wrapper" v-if="messages.length >= 2 && originalMessage && modifiedMessage">
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
import { jsonParse, jsonStringify } from '@/utils/jsonUtils'

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
      return jsonStringify(this.parsePayload(prev.payload), null, 2)
    } catch {
      return prev.payload || ''
    }
  }

  private get modifiedMessage(): string {
    const curr = this.currentMessage
    if (!curr || !curr.payload) return ''
    try {
      return jsonStringify(this.parsePayload(curr.payload), null, 2)
    } catch {
      return curr.payload || ''
    }
  }

  private parsePayload(payload: string): any {
    try {
      return jsonParse(payload)
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
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-primary);

    .nav-icon {
      width: 40px;
      height: 100%;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-title);
      background: var(--color-bg-normal);
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;

      &:hover {
        background: var(--color-main-green);
        color: #fff;
      }

      &.is-disabled {
        opacity: 0.25;
        cursor: not-allowed;
        pointer-events: none;
        background: transparent;
      }

      &.nav-left {
        border-right: 1px solid var(--color-border-default);
      }
    }

    .nav-right {
      display: flex;
      align-items: center;
      border-left: 1px solid var(--color-border-default);

      .nav-icon {
        border-left: 1px solid var(--color-border-default);

        &:first-child {
          border-left: none;
        }
      }
    }

    .header-side {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;

      &.previous {
        border-right: 1px solid var(--color-border-default);
      }

      &.current {
        background: rgba(52, 195, 136, 0.03);

        .side-label {
          background: var(--color-main-green);
          color: #fff;
        }
      }

      .side-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        padding: 4px 10px;
        border-radius: 4px;
        background: var(--color-text-light);
        color: #fff;
        flex-shrink: 0;
      }

      .side-time {
        font-size: 12px;
        font-weight: 500;
        color: var(--color-text-title);
        font-variant-numeric: tabular-nums;
      }

      .side-badges {
        display: flex;
        align-items: center;
        gap: 8px;

        .badge {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 4px;
          background: var(--color-bg-normal);
          color: var(--color-text-default);
          border: 1px solid var(--color-border-default);

          &.retain {
            background: var(--color-main-yellow);
            border-color: var(--color-main-yellow);
            color: #fff;
          }
        }
      }
    }
  }

  .diff-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

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
</style>
