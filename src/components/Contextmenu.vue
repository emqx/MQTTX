<template>
  <transition name="el-zoom-in-top">
    <el-card
      v-if="visible"
      class="contextmenu"
      :style="{ top: `${top}px`, left: `${left}px` }"
      v-click-outside="handleClickoutside">
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
      padding: 4px 12px;
      display: block;
      &:hover {
        color: var(--color-main-green);
        background: var(--color-second-green);
      }
      &.danger {
        color: var(--color-second-red);
        &:hover {
          color: var(--color-second-red);
          background: var(--color-third-red);
        }
      }
    }
    i {
      margin-right: 5px;
    }
  }
}
</style>
