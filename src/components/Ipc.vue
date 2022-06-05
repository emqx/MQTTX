<template>
  <div v-if="false"></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'

@Component
export default class Ipc extends Vue {
  private bindIpcEvents(): void {
    ipcRenderer.on('setting', (event: any, ...args: any[]) => {
      const eventType: any = args[0]
      const value: any = args[1]
      this.handleIcpEvents(eventType, value)
    })
    ipcRenderer.on('preferences', () => {
      this.$router.push({ path: '/settings' })
    })
    ipcRenderer.on('about', () => {
      this.$router.push({ path: '/about' })
    })
    ipcRenderer.on('newWindow', () => {
      const { id } = this.$route.params
      if (id) {
        ipcRenderer.send('newWindow', id)
      }
    })
  }

  private unbindIpcEvents(): void {
    ipcRenderer.removeAllListeners('setting')
  }

  private handleIcpEvents(event: string, value: any): void {
    switch (event) {
      case 'theme':
        this.$emit('setTheme', value)
        break
      case 'lang':
        this.$emit('setLang', value)
        break
      default:
        return
    }
  }

  private created(): void {
    this.bindIpcEvents()
  }

  private destroyed(): void {
    this.unbindIpcEvents()
  }
}
</script>
