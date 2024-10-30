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
    <traffic-statistics ref="trafficStats" :label="receivedTime" :received="receivedBytes" :sent="sentBytes" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import { globalEventBus } from '@/utils/globalEventBus'
import { Packet, IPublishPacket } from 'mqtt'
import TrafficStatistics from '@/components/widgets/TrafficStatistics.vue'
import { Getter } from 'vuex-class'
import { getTrafficMetrics } from '@/utils/SystemTopicUtils'

@Component({
  components: {
    ConnectionSelect,
    TrafficStatistics,
  },
})
export default class TrafficMonitor extends Vue {
  @Getter('currentTheme') private currentTheme!: Theme

  private receivedTime: string = ''
  private receivedBytes: number = 0
  private sentBytes: number = 0
  private selectedConnectionId: string = ''

  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish' || connectionInfo.id !== this.selectedConnectionId) {
      return
    }
    const publishPacket = packet as IPublishPacket
    const message: MessageModel = {
      topic: publishPacket.topic,
      payload: publishPacket.payload.toString(),
      createAt: new Date().toISOString(),
      out: false,
      qos: publishPacket.qos,
      retain: publishPacket.retain,
    }
    const trafficMetrics = getTrafficMetrics(message)
    if (trafficMetrics) {
      const { label, recevied, sent } = trafficMetrics
      this.receivedTime = label
      if (recevied) {
        this.receivedBytes = recevied
      }
      if (sent) {
        this.sentBytes = sent
      }

      const statsRef = this.$refs.trafficStats as TrafficStatistics
      this.$nextTick(() => {
        if (statsRef) {
          statsRef.updateChart()
        }
      })
    }
  }

  private handleConnectionChange(connectionId: string) {
    this.selectedConnectionId = connectionId
    this.receivedBytes = 0
    this.sentBytes = 0
    this.$nextTick(() => {
      const statsRef = this.$refs.trafficStats as TrafficStatistics
      if (statsRef) {
        statsRef.resetChart()
      }
    })
  }

  private created() {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  private beforeDestroy() {
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
