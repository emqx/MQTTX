<template>
  <div class="native-title-bar">
    MQTTX
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class NativeTitlebar extends Vue {
}
</script>


<style lang="scss">
.native-title-bar {
  width: 100%;
  height: 24px;
  line-height: 24px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-default);
  color: var(--color-text-title);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  -webkit-app-region: drag;
  text-align: center;
  z-index: 3;
}
</style>
