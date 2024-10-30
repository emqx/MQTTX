<template>
  <el-select v-model="modelValue" class="connection-select" v-bind="$attrs" :style="{ width }">
    <el-option v-for="conn in connections" :key="conn.id" :label="`${conn.name}@${conn.host}`" :value="conn.id">
      <span style="float: left">{{ conn.name }}@{{ conn.host }}</span>
      <span style="float: right; color: #8492a6; font-size: 13px; margin-left: 24px">
        {{ getConnectionStatus(conn.id) }}
      </span>
    </el-option>
  </el-select>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import useServices from '@/database/useServices'

@Component
export default class ConnectionSelect extends Vue {
  @Prop({ type: String, default: '' }) readonly value!: string
  @Prop({ default: '300px' }) private width!: string
  @Getter('activeConnection') private activeConnection!: ActiveConnection

  private connections: ConnectionModel[] = []
  private modelValue = this.value

  @Watch('value')
  private onValueChange(newVal: string) {
    this.modelValue = newVal
  }

  @Watch('modelValue')
  private onModelValueChange(newVal: string) {
    this.$emit('input', newVal)
    this.$emit('change', newVal)
  }

  private getConnectionStatus(connectionId: string) {
    if (this.activeConnection[connectionId]) {
      return this.activeConnection[connectionId].client.connected
        ? this.$tc('connections.connected')
        : this.$tc('connections.noConnection')
    }
    return this.$tc('connections.noConnection')
  }

  private async loadConnections() {
    const { connectionService } = useServices()
    try {
      this.connections = (await connectionService.getAll()) ?? []
      if (this.connections.length > 0 && !this.modelValue) {
        await this.setInitialConnection()
      }
    } catch (error) {
      this.$log.error(`ConnectionSelect: load all connections failed: ${error}`)
    }
  }

  private async setInitialConnection() {
    const urlQueryId = this.$route.query.connectionId
    if (urlQueryId) {
      this.modelValue = urlQueryId as string
    } else {
      const { connectionService } = useServices()
      const lastestId: string | undefined = await connectionService.getLeatestId()
      this.modelValue = lastestId || (this.connections[0].id as string)
    }
  }

  private async created() {
    await this.loadConnections()
  }
}
</script>
