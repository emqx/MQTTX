<template>
  <div ref="leftPanel" class="left-panel">
    <transition name="pop">
      <!-- Insert content into this to directly generate a pop-up effect on the left -->
      <slot></slot>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LeftPanel extends Vue {}
</script>

<style lang="scss">
.left-panel {
  & > div {
    position: fixed;
    left: 341px;
    z-index: 1;
    width: 240px;
    background: var(--color-bg-normal);
    border-radius: 0;
    top: 0;
    bottom: 0;
    padding-bottom: 42px;
  }
}
.pop-enter-active {
  animation: leftbarPop 0.4s;
}
.pop-leave-active {
  animation: leftbarPop 0.4s reverse;
}
.left-panel {
  @keyframes leftbarPop {
    from {
      left: 0;
    }
    to {
      left: 341px;
    }
  }
}
</style>
