<template>
  <div id="resize-height" class="resize-height" @mousedown="handleMousedown"></div>
</template>

<script lang="ts">
import { Component, Vue, Model } from 'vue-property-decorator'
import { trackDrag } from '@/utils/trackDrag'

@Component
export default class ResizeHeight extends Vue {
  @Model('change', { type: Number }) private readonly value!: number

  private stopResizing: (() => void) | null = null

  private handleMousedown(event: MouseEvent) {
    const startValue = this.value
    this.stopResizing = trackDrag(event, (dx, dy) => this.$emit('change', startValue - dy))
  }

  private beforeDestroy() {
    this.stopResizing?.()
  }
}
</script>

<style lang="scss">
.resize-height {
  width: 100%;
  height: 2px;
  cursor: row-resize;
  text-align: center;
  transition: all 0.1s;
  &:hover,
  &:active {
    background-color: var(--color-main-green);
  }
  .el-icon-more {
    position: relative;
    top: -4px;
  }
}
</style>
