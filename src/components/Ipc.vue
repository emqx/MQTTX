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
    ipcRenderer.on('newConnections', () => {
      this.$router.push({ path: '/recent_connections/0?oper=create' })
    })
    ipcRenderer.on('showProgress', (event, args) => {
      const percentValue: any = args[0]
      console.log(percentValue)
    })
  }

  private unbindIpcEvents(): void {
    ipcRenderer.removeAllListeners('setting')
    ipcRenderer.removeAllListeners('preferences')
    ipcRenderer.removeAllListeners('about')
    ipcRenderer.removeAllListeners('newWindow')
    ipcRenderer.removeAllListeners('newConnections')
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
    console.log(123)
    this.bindIpcEvents()
  }

  private destroyed(): void {
    this.unbindIpcEvents()
  }
}
</script>
