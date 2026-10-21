<template>
  <transition name="el-zoom-in-top">
    <el-card v-if="visible" class="contextmenu" :style="menuStyle" v-click-outside="handleClickoutside">
      <slot></slot>
    </el-card>
  </transition>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import ClickOutside from 'vue-click-outside'
import getContextmenuPosition from '@/utils/getContextmenuPosition'

@Component({
  directives: {
    ClickOutside,
  },
})
export default class Contextmenu extends Vue {
  @Prop({ default: 0 }) public top!: number
  @Prop({ default: 0 }) public left!: number
  @Prop({ required: true }) public visible!: boolean
  /**
   * The button the menu hangs off. When set, the menu places itself: right edge
   * on the button's right edge, 4px under it, clamped to the viewport with its
   * own measured size. Without it, `top`/`left` are used as before.
   */
  @Prop({ default: null }) public anchor!: DOMRect | null

  // Placement measured for the anchor path; `null` means "use the props".
  private anchorPlacement: { top: number; left: number } | null = null

  private get menuStyle(): { top: string; left: string } {
    const { top, left } = this.anchorPlacement || { top: this.top, left: this.left }
    return { top: `${top}px`, left: `${left}px` }
  }

  @Watch('visible')
  @Watch('anchor')
  private onAnchorOrVisibilityChanged() {
    if (!this.visible || !this.anchor) {
      // Hidden or right-click path: back to the `top`/`left` props.
      this.anchorPlacement = null
      return
    }
    this.placeAtAnchor()
  }

  private mounted() {
    this.placeAtAnchor()
  }

  /**
   * The menu is content-sized (its width changes with the language), so the
   * placement waits for the rendered element and uses its real size. The
   * callback runs before the browser paints, so the menu never shows at the
   * props' position first.
   */
  private placeAtAnchor(): void {
    if (!this.visible || !this.anchor) return

    this.$nextTick(() => {
      const anchor = this.anchor
      const el = this.$el as HTMLElement | undefined
      if (!this.visible || !anchor || !el || !el.offsetWidth) return

      const { x, y } = getContextmenuPosition(
        { clientX: anchor.right - el.offsetWidth, clientY: anchor.bottom + 4 } as MouseEvent,
        el.offsetWidth,
        el.offsetHeight,
      )
      this.anchorPlacement = { top: y, left: x }
    })
  }

  private handleClickoutside() {
    if (this.visible) {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss">
.contextmenu {
  position: fixed;
  z-index: 10000;
  .el-card__body {
    padding: 8px 0px;
    .context-menu__item {
      &.disabled {
        cursor: not-allowed;
        color: var(--color-text-light);
        &:hover {
          color: var(--color-text-light);
        }
      }
      padding: 4px 12px;
      display: flex;
      align-items: center;
      .iconfont {
        font-size: 18px;
      }
      &:hover {
        color: var(--color-main-green);
        background: var(--color-light-green);
      }
      &.danger {
        color: var(--color-minor-red);
        &:hover {
          color: var(--color-minor-red);
          background: var(--color-light-red);
        }
      }
    }
    i {
      margin-right: 5px;
    }
    .icon-delete {
      margin-right: 4px;
    }
    [class^='el-icon-'],
    [class*=' el-icon-'] {
      font-weight: 500;
      font-size: 18px;
    }
  }
}
</style>
