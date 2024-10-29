<template>
  <div class="traffic-monitor-view">
    <div class="traffic-monitor-header mb-3">
      <connection-select v-model="selectedConnectionId" size="small" @change="handleConnectionChange" />
      <span class="traffic-monitor-about ml-3">
        <el-tooltip
          :content="$t('viewer.brokerTrafficMonitorTooltip')"
          placement="top"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
        >
          <i class="iconfont icon-about"></i>
        </el-tooltip>
      </span>
    </div>
    <traffic-statistics ref="trafficStats" :label="currentTime" :received="receivedBytes" :sent="sentBytes" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import { globalEventBus } from '@/utils/globalEventBus'
import { Packet } from 'mqtt'
import TrafficStatistics from '@/components/widgets/TrafficStatistics.vue'
import time from '@/utils/time'
import { Getter } from 'vuex-class'

@Component({
  components: {
    ConnectionSelect,
    TrafficStatistics,
  },
})
export default class TrafficMonitor extends Vue {
  @Getter('currentTheme') private currentTheme!: Theme

  private currentTime: string = ''
  private receivedBytes: number = 0
  private sentBytes: number = 0
  private timer: number | null = null
  private selectedConnectionId: string = ''

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

  private handleConnectionChange(connectionId: string) {
    console.log(connectionId)
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

<style lang="scss">
.traffic-monitor-view {
  .traffic-monitor-header {
    display: flex;
    align-items: center;

    .iconfont {
      color: var(--color-text-default);
      cursor: pointer;
    }
  }
}
</style>
