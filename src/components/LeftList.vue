<template>
  <div class="leftList">
    <slot></slot>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LeftList extends Vue {}
</script>


<style lang="scss">
.leftList {
  position: fixed;
  width: 260px;
  left: 81px;
  top: 0;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1000;
  border-right: 2px solid var(--color-border-default);
  background-color: var(--color-bg-primary);
  .no-data {
    text-align: center;
    position: absolute;
    top: 45%;
    left: 40%;
    color: var(--color-text-light);
  }
}
</style>
