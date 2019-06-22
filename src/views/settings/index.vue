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
// import { Action } from 'vuex-class'

@Component({
  components: {
    Leftbar,
  },
})
export default class Settings extends Vue {
  // @Action('TOGGLE_THEME') private actionTheme: any

  // private setItem() {
  //   this.actionTheme({ currentTheme: 'light' })
  // }
}
</script>


<style lang="scss">
.settings-view {
  .titlebar {
    height: 60px;
  }
}
</style>
