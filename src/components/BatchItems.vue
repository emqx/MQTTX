<template>
  <div :class="['batch-items', direction]" :style="{ '--batch-index-width': indexWidth }">
    <div v-for="(item, index) in previewItems" :key="index" class="batch-row">
      <span class="batch-index">{{ index + 1 }}</span>
      <span class="batch-content" :title="item.title"
        >{{ item.text
        }}<span v-if="item.binary" class="batch-muted">
          ({{ $t('connections.batchBinary') }}, {{ formatBytes(item.bytes) }})</span
        ></span
      >
    </div>
    <p v-if="summary" class="batch-summary batch-muted">
      {{ $t('connections.batchSummary', { saved: items.length, total: count }) }}
    </p>
    <el-button
      v-else-if="items.length > previewItems.length"
      class="see-more-btn"
      type="info"
      plain
      size="mini"
      @click="$emit('view-all')"
    >
      {{ $t('common.seeMore') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { BATCH_PREVIEW_ITEMS, StoredBatchItem, BatchItemDisplay, getBatchItemDisplay } from '@/utils/batchPayload'
import { formatBytes } from '@/utils/formatter'

@Component
export default class BatchItems extends Vue {
  @Prop({ required: true }) public items!: StoredBatchItem[]
  @Prop({ required: true }) public count!: number
  @Prop({ default: false }) public summary!: boolean
  @Prop({ default: 'left' }) public direction!: string

  get previewItems(): BatchItemDisplay[] {
    return this.items.slice(0, BATCH_PREVIEW_ITEMS).map(getBatchItemDisplay)
  }

  get indexWidth(): string {
    return `${String(this.previewItems.length).length}ch`
  }

  private formatBytes = formatBytes
}
</script>

<style lang="scss">
.batch-items {
  margin-top: 10px;
  .batch-row {
    font-family: monospace;
    font-size: 13px;
    line-height: 1.6;
    min-height: 1.6em;
    display: flex;
    gap: 10px;
  }
  .batch-index {
    flex: 0 0 var(--batch-index-width);
    color: var(--color-text-tips);
    text-align: right;
    font-size: 12px;
  }
  .batch-content {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .batch-muted {
    color: var(--color-text-tips);
    font-size: 12px;
  }
  p.batch-summary {
    margin-top: 8px;
    font-family: inherit;
  }
  &.right {
    .batch-index,
    .batch-muted {
      color: var(--color-text-right_info);
    }
  }
}
</style>
