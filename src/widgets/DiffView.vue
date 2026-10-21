<template>
  <div class="diff-view">
    <MessageViewerHeader
      v-if="currentMessage && previousMessage"
      class="diff-header"
      :previous-disabled="!canGoToPrevious && !hasMore"
      :next-disabled="!canGoToNext"
      :latest-disabled="currentIndex === 0"
      @previous="goToPrevious"
      @next="goToNext"
      @latest="goToLatest"
    >
      <div class="header-side previous">
        <span class="side-label">{{ $t('viewer.previous') }}</span>
        <MessageHeaderMeta :message="previousMessage" />
      </div>
      <div class="header-side current">
        <span class="side-label">{{ $t('viewer.currentLabel') }}</span>
        <MessageHeaderMeta :message="currentMessage" />
      </div>
    </MessageViewerHeader>

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
import Editor from '@/components/Editor.vue'
import MessageHeaderMeta from '@/widgets/MessageHeaderMeta.vue'
import MessageViewerHeader from '@/widgets/MessageViewerHeader.vue'
import { jsonParse, jsonStringify } from '@/utils/jsonUtils'

@Component({
  components: {
    Editor,
    MessageHeaderMeta,
    MessageViewerHeader,
  },
})
export default class DiffView extends Vue {
  @Prop({ type: Array, default: () => [] }) private messages!: MessageModel[]
  @Prop({ type: Boolean, default: false }) private hasMore!: boolean

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
    align-items: center;
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
