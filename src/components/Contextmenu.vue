<template>
  <transition name="el-zoom-in-top">
    <el-card
      v-if="visible"
      class="contextmenu"
      :style="{ top: `${top}px`, left: `${left}px` }"
      v-click-outside="handleClickoutside"
    >
      <slot></slot>
    </el-card>
  </transition>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import ClickOutside from 'vue-click-outside'

@Component({
  directives: {
    ClickOutside,
  },
})
export default class Contextmenu extends Vue {
  @Prop({ required: true }) public top!: number
  @Prop({ required: true }) public left!: number
  @Prop({ required: true }) public visible!: boolean

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
  }
}
</style>
