<template>
  <div class="json-tree-view">
    <MessageViewerHeader
      v-if="currentMessage && currentMessage.createAt"
      class="json-header"
      :previous-disabled="!canGoToPrevious"
      :next-disabled="!canGoToNext"
      :latest-disabled="currentIndex === 0"
      @previous="goToPrevious"
      @next="goToNext"
      @latest="goToLatest"
    >
      <div class="header-content">
        <MessageHeaderMeta :message="currentMessage" />
        <div class="header-tools">
          <el-input
            v-model="searchQuery"
            :placeholder="$t('viewer.searchInJson')"
            size="small"
            prefix-icon="el-icon-search"
            clearable
            @input="onSearchInput"
            class="search-input"
          />
          <el-tooltip
            :effect="theme !== 'light' ? 'light' : 'dark'"
            placement="bottom"
            :open-delay="500"
            :content="$t('viewer.visualizeJsonTree')"
          >
            <i class="tool-icon el-icon-pie-chart" @click="openVisualTreeModal"></i>
          </el-tooltip>
          <el-tooltip
            placement="bottom"
            :effect="theme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('common.copy')"
          >
            <i
              class="tool-icon iconfont icon-copy"
              :class="{ 'is-disabled': !currentMessage || !currentMessage.payload }"
              @click="copyPayload(currentMessage && currentMessage.payload ? currentMessage.payload : '')"
            ></i>
          </el-tooltip>
        </div>
      </div>
    </MessageViewerHeader>

    <div class="json-content-wrapper" v-if="messages.length > 0">
      <div class="json-container" ref="jsonContainer">
        <tree-view :data="parseJson(currentMessage.payload)" :options="treeOptions" />
      </div>
    </div>

    <div v-else class="no-messages">
      <p>{{ $t('common.noData') }}</p>
    </div>

    <my-dialog
      top="30px"
      :fullscreen="true"
      :visible.sync="showVisualTreeModal"
      :title="$t('viewer.visualizeJsonTree')"
      width="96%"
      class="visualize-tree-dialog"
      :btn-disabled="true"
      @close="handleVisualizeTreeDialogClose"
      @open="handleVisualizeTreeDialogOpen"
    >
      <el-input-number
        controls-position="right"
        class="my-3 ml-3"
        v-model="defaultExpandLevel"
        :min="0"
        size="small"
        @change="handleExpandLevelChange"
      ></el-input-number>
      <span class="visualize-tree-about">
        <el-tooltip
          :content="$t('viewer.visualizeJsonTreeTooltip')"
          placement="top"
          :effect="theme !== 'light' ? 'light' : 'dark'"
        >
          <i class="iconfont icon-about"></i>
        </el-tooltip>
      </span>
      <tree-visual
        v-if="treeData"
        id="json-tree-view"
        :data="treeData"
        :defaultExpandLevel="defaultExpandLevel"
        :is-json-mode="true"
        :enable-zoom="true"
        :enable-toolbox="true"
        style="height: calc(100vh - 230px)"
        :tooltip-formatter="customTooltipFormatter"
      />
    </my-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import TreeView from 'vue-json-tree-view/src/TreeView.vue'
import type { TreeViewOptions } from 'vue-json-tree-view/src/TreeView.vue'
import TreeVisual from '@/components/charts/TreeVisual.vue'
import MyDialog from '@/components/MyDialog.vue'
import MessageHeaderMeta from '@/widgets/MessageHeaderMeta.vue'
import MessageViewerHeader from '@/widgets/MessageViewerHeader.vue'
import { JsonTreeConverter } from '@/utils/jsonTreeConverter'
import { highlightInPrismCode } from '@/utils/highlightSearch'
import { jsonParse, toPlainObject } from '@/utils/jsonUtils'

@Component({
  components: {
    TreeView,
    TreeVisual,
    MyDialog,
    MessageHeaderMeta,
    MessageViewerHeader,
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
  private searchTimeout: ReturnType<typeof setTimeout> | null = null
  private showVisualTreeModal = false
  private defaultExpandLevel = 1

  get currentTheme(): string {
    return this.theme || 'light'
  }

  get treeOptions(): TreeViewOptions {
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

  get treeData() {
    try {
      const parsed = this.parseJson(this.currentMessage.payload)
      return JsonTreeConverter.convertJsonToTreeData(parsed)
    } catch {
      return null
    }
  }

  customTooltipFormatter = (params: any) => {
    const data = params.data

    const lines: string[] = []
    lines.push(`<div style="font-weight: bold; color: #2563eb; margin-bottom: 4px;">${data.id}</div>`)
    lines.push(`<div style="color: #6b7280; font-size: 11px;">Type: ${data.vtype}</div>`)
    const childCount = data.children ? data.children.length : 0
    lines.push(`<div style="color: #059669; margin-top: 2px;">Children: ${childCount}</div>`)

    return `<div style="max-width: 320px; line-height: 1.4;">${lines.join('')}</div>`
  }

  @Watch('currentIndex')
  private onCurrentIndexChange(): void {
    this.$nextTick(() => {
      if (this.searchQuery.trim()) {
        this.applySearchHighlight()
      }
    })
  }

  openVisualTreeModal(): void {
    this.showVisualTreeModal = true
  }

  handleVisualizeTreeDialogClose(): void {
    this.showVisualTreeModal = false
  }

  handleVisualizeTreeDialogOpen(): void {
    // Load saved expand level from localStorage
    const expandLevel = localStorage.getItem('json-tree-expand-level')
    this.defaultExpandLevel = expandLevel ? parseInt(expandLevel) : 1
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

  private parseJson(payload: string): any {
    try {
      const parsed = jsonParse(payload)
      return toPlainObject(parsed)
    } catch {
      return payload
    }
  }

  private getContainerEl(): HTMLElement | null {
    const el = this.$refs.jsonContainer as HTMLElement | undefined
    return el || null
  }

  private copyPayload(payload: string): void {
    if (!payload) return
    this.$copyText(payload)
      .then(() => {
        this.$message.success(this.$tc('common.copySuccess'))
      })
      .catch(() => {
        this.$message.error(this.$tc('common.copyFail'))
      })
  }

  private onSearchInput(): void {
    if (this.searchTimeout !== null) {
      clearTimeout(this.searchTimeout)
    }
    this.searchTimeout = setTimeout(() => {
      this.applySearchHighlight()
    }, 300)
  }

  private clearSearchHighlights(): void {
    const container = this.getContainerEl()
    if (!container) return

    const highlighted = container.querySelectorAll('span.search-highlight')
    highlighted.forEach((el) => {
      const parent = el.parentNode as Node
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

  private handleExpandLevelChange(value: number): void {
    this.defaultExpandLevel = value
    localStorage.setItem('json-tree-expand-level', value.toString())
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
    if (this.searchTimeout !== null) {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = null
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/mixins.scss';
.json-tree-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-normal);
  color: var(--color-text-default);

  .json-header {
    align-items: stretch;
  }

  .header-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;

    .header-tools {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;

      .search-input {
        width: 200px;
      }

      .tool-icon {
        font-size: 16px;
        color: var(--color-text-default);
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        transition: all 0.15s ease;

        &:hover {
          color: var(--color-main-green);
          background: var(--color-bg-normal);
        }

        &.is-disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
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
</style>
