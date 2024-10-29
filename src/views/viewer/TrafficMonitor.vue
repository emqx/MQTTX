<template>
  <div class="traffic-monitor-view">
    <traffic-statistics ref="trafficStats" :label="currentTime" :received="receivedBytes" :sent="sentBytes" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'
import { Packet } from 'mqtt'
import TrafficStatistics from '@/components/widgets/TrafficStatistics.vue'
import time from '@/utils/time'

@Component({
  components: {
    TrafficStatistics,
  },
})
export default class TrafficMonitor extends Vue {
  private currentTime: string = ''
  private receivedBytes: number = 0
  private sentBytes: number = 0
  private timer: number | null = null

  // Simulate data updates
  private simulateDataUpdate() {
    this.timer = window.setInterval(() => {
      this.currentTime = time.getNowDate()
      // Simulate growth of received and sent bytes
      this.receivedBytes += Math.floor(Math.random() * 1000)
      this.sentBytes += Math.floor(Math.random() * 800)

      // Update chart
      const statsRef = this.$refs.trafficStats as TrafficStatistics
      this.$nextTick(() => {
        if (statsRef) {
          statsRef.updateChart()
        }
      })
    }, 2000) // Update every 2 seconds
  }

  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish') return
    console.log(connectionInfo)
    console.log(packet)
  }

  private async created() {
    this.simulateDataUpdate()
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  private beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    globalEventBus.off('packetReceive', this.handlePacketReceive)
  }
}
</script>
