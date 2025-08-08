<template>
  <div class="json-tree-view">
    <div class="json-header">
      <div class="header-content">
        <h3>Message JSON Viewer</h3>
      </div>
      <div class="message-info" v-if="currentMessage">
        <div class="info-item">
          <span class="label">Time:</span>
          <span class="value">{{ formatTime(currentMessage.createAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">QoS:</span>
          <span class="value">{{ currentMessage.qos }}</span>
        </div>
        <div class="info-item">
          <span class="label">Retain:</span>
          <span class="value">{{ currentMessage.retain ? 'Yes' : 'No' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Size:</span>
          <span class="value">{{ getPayloadSize(currentMessage.payload) }}</span>
        </div>
      </div>
    </div>

    <div class="json-content-wrapper" v-if="messages.length > 0">
      <div class="json-content">
        <div class="message-tree">
          <div class="message-header">
            <div class="header-left">
              <el-input
                v-model="searchQuery"
                placeholder="Search in JSON..."
                size="small"
                prefix-icon="el-icon-search"
                clearable
                @input="onSearchInput"
                class="search-input"
              />
            </div>
            <div class="navigation-controls">
              <button
                class="nav-button nav-button--prev"
                :disabled="!canGoToPrevious && !hasMore"
                @click="goToPrevious"
                title="Older Message"
              >
                <i class="el-icon-arrow-left"></i>
              </button>
              <button
                class="nav-button nav-button--next"
                :disabled="!canGoToNext"
                @click="goToNext"
                title="Newer Message"
              >
                <i class="el-icon-arrow-right"></i>
              </button>
              <button
                class="nav-button nav-button--latest"
                :disabled="currentIndex === 0"
                @click="goToLatest"
                title="Go to Latest Message"
              >
                <i class="el-icon-top"></i>
              </button>
            </div>
            <div class="header-right">
              <el-tooltip
                placement="bottom"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :content="copiedJson ? 'Copied!' : 'Copy JSON'"
              >
                <a
                  href="javascript:;"
                  class="copy-btn"
                  @click="copyPayload(currentMessage.payload)"
                  :class="{ copied: copiedJson }"
                >
                  <i :class="copiedJson ? 'el-icon-check' : 'el-icon-document-copy'"></i>
                </a>
              </el-tooltip>
            </div>
          </div>

          <div class="json-container" ref="jsonContainer">
            <tree-view :data="parseJson(currentMessage.payload)" :options="treeOptions" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-messages">
      <p>No messages available.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import TreeView from 'vue-json-tree-view/src/TreeView.vue'
import { calculateTextSize } from '@/utils/data'
import { highlightInPrismCode } from '@/utils/highlightSearch'

@Component({
  components: {
    TreeView,
  },
})
export default class JsonViewer extends Vue {
  @Prop({ type: Array, default: () => [] })
  private messages!: MessageModel[]

  @Prop({ type: Boolean, default: false })
  private hasMore!: boolean

  @Getter('currentTheme')
  private theme!: string

  private searchQuery = ''
  private currentIndex = 0
  private copiedJson = false
  private searchTimeout: any = null

  get currentTheme(): string {
    return this.theme || 'light'
  }

  get treeOptions(): any {
    return {
      maxDepth: 4,
      rootObjectKey: 'message',
      modifiable: false,
      link: false,
      limitRenderDepth: false,
    }
  }

  get currentMessage(): MessageModel {
    return this.messages[this.currentIndex] || ({} as MessageModel)
  }

  get canGoToPrevious(): boolean {
    return this.currentIndex < this.messages.length - 1
  }

  get canGoToNext(): boolean {
    return this.currentIndex > 0
  }

  @Watch('currentIndex')
  private onCurrentIndexChange(): void {
    this.$nextTick(() => {
      if (this.searchQuery.trim()) {
        this.applySearchHighlight()
      }
    })
  }

  goToPrevious(): void {
    if (this.canGoToPrevious) {
      this.currentIndex++
    } else if (this.hasMore) {
      this.$emit('request-older')
    }
  }

  goToNext(): void {
    if (this.canGoToNext) {
      this.currentIndex--
    }
  }

  goToLatest(): void {
    this.currentIndex = 0
  }

  private formatTime(timeString: string): string {
    try {
      return new Date(timeString).toLocaleString()
    } catch {
      return timeString
    }
  }

  private parseJson(payload: string): any {
    try {
      return JSON.parse(payload)
    } catch {
      return payload
    }
  }

  private getPayloadSize(payload: string): string {
    return calculateTextSize(payload)
  }

  private getContainerEl(): HTMLElement | null {
    const el = this.$refs.jsonContainer as HTMLElement | undefined
    return el || null
  }

  private copyPayload(payload: string): void {
    navigator.clipboard.writeText(payload).then(() => {
      this.copiedJson = true
      setTimeout(() => (this.copiedJson = false), 1200)
    })
  }

  private onSearchInput(): void {
    clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => {
      this.applySearchHighlight()
    }, 300)
  }

  private clearSearchHighlights(): void {
    const container = this.getContainerEl()
    if (!container) return

    const highlighted = container.querySelectorAll('span.search-highlight')
    highlighted.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        const text = el.textContent || ''
        const textNode = document.createTextNode(text)
        parent.replaceChild(textNode, el)
        parent.normalize()
      }
    })
  }

  private applySearchHighlight(): void {
    const container = this.getContainerEl()
    if (!container) return

    this.clearSearchHighlights()
    this.$nextTick(() => {
      if (!this.searchQuery.trim()) return
      highlightInPrismCode(container, this.searchQuery)
      this.$nextTick(() => this.scrollToFirstHighlight())
    })
  }

  private scrollToFirstHighlight(): void {
    const container = this.getContainerEl()
    if (!container) return

    const first = container.querySelector('.search-highlight') as HTMLElement | null
    if (first) {
      first.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/mixins.scss';
.json-tree-view {
  @include search-highlight;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-normal);
  color: var(--color-text-default);
  .json-header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-primary);
    .header-content {
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
  .json-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .json-content {
    flex: 1;
    min-height: 0;
    background: var(--color-bg-normal);
  }
  .message-tree {
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .message-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 12px 16px;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-default);
    position: relative;
    .header-left {
      justify-self: start;
    }
    .header-right {
      justify-self: end;
      .copy-btn {
        color: var(--color-text-title);
        margin-right: 16px;
        i {
          font-size: 20px;
          color: var(--color-text-title);
          font-weight: 400;
        }
        &.copied {
          i {
            color: var(--color-main-green);
          }
        }
      }
    }
    .search-input {
      width: 300px;
      max-width: 100%;
    }
    .navigation-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-self: center;
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
  }
  .json-container {
    padding: 16px;
    background: var(--color-bg-normal);
    flex: 1;
    overflow: auto;
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
::v-deep {
  @include search-highlight;
}
::v-deep .tree-view-item {
  background: var(--color-bg-normal) !important;
  color: var(--color-text-default) !important;
  .tree-view-item-key {
    color: var(--color-main-green) !important;
  }
  .tree-view-item-value {
    &.tree-view-item-value-string {
      color: hsl(119, 34%, 47%) !important;
    }
    &.tree-view-item-value-number {
      color: hsl(35, 99%, 36%) !important;
    }
    &.tree-view-item-value-boolean {
      color: hsl(301, 63%, 40%) !important;
    }
    &.tree-view-item-value-null {
      color: hsl(35, 99%, 36%) !important;
    }
  }
}
.theme-night .json-tree-view {
  .message-header {
    .header-actions {
      .navigation-controls {
        .nav-button {
          &:hover:not(:disabled) {
            box-shadow: 0 2px 12px rgba(52, 195, 136, 0.25);
          }
        }
      }
    }
  }
}
</style>
