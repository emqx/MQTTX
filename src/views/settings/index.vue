<template>
  <div>
    <leftbar/>
    <div class="settings-view right-content">
      <div class="titlebar">Settings</div>
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
export default class Settings extends Vue {}
</script>


<style lang="scss">
.settings-view {
  .titlebar {
    height: 60px;
  }
}
</style>
