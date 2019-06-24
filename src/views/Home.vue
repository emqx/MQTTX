<template>
  <div class="home-view">
    <router-view/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'

@Component
export default class Home extends Vue {
  @Getter('currentTheme') private getterTheme: any

  private setTheme(currentTheme: string): void {
    const bodyTag: HTMLBodyElement | null = document.querySelector('body')
    if (!bodyTag) {
      return
    }
    bodyTag.className = currentTheme
  }

  private bindIpcEvents(): void {
    ipcRenderer.on('setting', (event: any, ...args: any[]) => {
      const value: string = args[0]
      this.setTheme(value)
    })
  }

  private unbindIpcEvents(): void {
    ipcRenderer.removeAllListeners('setting')
  }

  private created() {
    this.bindIpcEvents()
    this.setTheme(this.getterTheme)
  }

  private beforeDestroy() {
    this.unbindIpcEvents()
  }
}
</script>


<style lang="scss">
.home-view {
  min-height: 100%;
  background-color: var(--color-bg-primary);
  .right-content {
    margin-left: 300px;
    min-height: 100%;
  }
}
</style>
