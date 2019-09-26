<template>
  <div ref="rightPanel" class="right-panel">
    <transition name="pop">
      <!-- Insert content into this to directly generate a pop-up effect on the right -->
      <slot></slot>
    </transition>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class RightPanel extends Vue {}
</script>


<style lang="scss">
.right-panel {
  & > div {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1002;
    width: 300px;
    height: 100%;
    background: #fff;
    border-radius: 0;
    box-shadow: -5px 0px 12px rgba(0, 0, 0, 0.1);
    overflow: scroll;
  }
}
.pop-enter-active {
  animation: rightbarPop .4s;
}
.pop-leave-active {
  animation: rightbarPop .4s reverse;
}
.right-panel {
  @keyframes rightbarPop {
    from {
      right: -316px;
    }
    to {
      right: 0;
    }
  }
}
</style>
