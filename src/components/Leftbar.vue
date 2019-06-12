<template>
  <div class="leftbar">
    <tabbar/>
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
  width: 298px;
  top: 0;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1000;
  border-right: 2px solid rgba(230,232,241,1);
  background-color: #fff;
}
</style>
