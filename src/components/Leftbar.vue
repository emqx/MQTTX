<template>
  <div class="leftbar">
    <slot></slot>
    <Tabbar/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Tabbar from '@/components/Tabbar.vue'

@Component({
  components: {
    Tabbar,
  },
})

export default class Leftbar extends Vue {}
</script>


<style lang="scss">
.leftbar {
  position: fixed;
  width: 300px;
  top: 0;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1000;
  border-right: 2px solid var(--color-border-default);
  background-color: var(--color-bg-normal);
  .no-data {
    text-align: center;
    position: absolute;
    top: 45%;
    left: 40%;
    color: var(--color-text-light);
  }
}
</style>
