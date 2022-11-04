<template>
  <div id="resize-height" class="resize-height" @mousedown="handleMousedown"></div>
</template>

<script lang="ts">
import { Component, Vue, Model } from 'vue-property-decorator'

@Component
export default class ResizeHeight extends Vue {
  @Model('change', { type: Number }) private readonly value!: number

  private handleMousedown(event: MouseEvent) {
    let yValue: number = event.y
    document.onmousemove = (moveEvent: MouseEvent) => {
      const yMove: number = moveEvent.y
      const offset: number = yMove - yValue
      yValue = moveEvent.y
      this.$emit('change', this.value - offset)
      const bodyTag: HTMLBodyElement | null = document.querySelector('body')
      if (!bodyTag) {
        return
      }
      bodyTag.classList.add('select-none')
    }
  }
  private created() {
    document.onmouseup = () => {
      document.onmousemove = null
      const bodyTag: HTMLBodyElement | null = document.querySelector('body')
      if (!bodyTag) {
        return
      }
      bodyTag.classList.remove('select-none')
    }
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
