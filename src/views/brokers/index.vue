<template>
  <div>
    <leftbar/>
    <div class="brokers-view right-content">
      <div class="titlebar">Brokers</div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'

@Component({
  components: {
    Leftbar,
  },
})
export default class Brokers extends Vue {}
</script>


<style lang="scss">
.brokers-view {
  .titlebar {
    height: 60px;
  }
}
</style>
