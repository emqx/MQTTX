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
import { Getter, Action } from 'vuex-class'
import { ipcRenderer } from 'electron'
import Leftbar from '@/components/Leftbar.vue'

@Component({
  components: {
    Leftbar,
  },
})
export default class Settings extends Vue {
  @Action('TOGGLE_THEME') private actionTheme: any
  @Getter('currentTheme') private getterTheme: any
  private currentTheme: string = 'light'

  private toggleTheme(currentTheme: string): void {
    if (this.getterTheme === currentTheme) {
      return
    }
    this.actionTheme({ currentTheme })
    ipcRenderer.send('setting', currentTheme)
  }

  private created() {
    this.currentTheme = this.getterTheme
  }
}
</script>


<style lang="scss">
.settings-view {
  .titlebar {
    height: 60px;
  }
}
</style>
