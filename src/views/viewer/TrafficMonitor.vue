<template>
  <div class="traffic-monitor-view">
    <p>{{ $t('viewer.brokerTrafficMonitorTooltip') }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'
import { Packet } from 'mqtt'

@Component
export default class TrafficMonitor extends Vue {
  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish') return
    console.log(connectionInfo)
    console.log(packet)
  }

  private async created() {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  private beforeDestroy() {
    globalEventBus.off('packetReceive', this.handlePacketReceive)
  }
}
</script>
