<template>
  <div class="traffic-monitor-view">
    <div class="traffic-monitor-header mb-3">
      <div>
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
      <time-range-select v-model="timeRange" class="float-right" @change="handleTimeRangeChange" />
    </div>
    <traffic-statistics
      chart-id="bytes"
      class="mb-6 bytes"
      ref="trafficStatsBytes"
      :label="receivedBytesLastTime"
      :received="receivedBytes"
      :sent="sentBytes"
      :name-config="{ received: $t('viewer.accumulatedReceivedTraffic'), sent: $t('viewer.accumulatedSentTraffic') }"
    />
    <traffic-statistics
      chart-id="rate"
      class="rate"
      ref="trafficStatsRate"
      chart-type="line"
      unit="/s"
      :label="receivedRateLastTime"
      :received="receivedRate"
      :sent="sentRate"
      :name-config="{ received: $t('viewer.receivedTrafficRate'), sent: $t('viewer.sentTrafficRate') }"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { Packet, IPublishPacket } from 'mqtt'
import { Subscription } from 'rxjs'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import TrafficStatistics from '@/widgets/TrafficStatistics.vue'
import { globalEventBus } from '@/utils/globalEventBus'
import { calculateTrafficRates, transformTrafficMessages } from '@/utils/systemTopic'
import useServices from '@/database/useServices'
import time from '@/utils/time'
import { MessageQueue } from '@/utils/messageQueue'
import { getMessageId } from '@/utils/idGenerator'
import TimeRangeSelect from '@/components/TimeRangeSelect.vue'

interface StoreMessageModel extends MessageModel {
  connectionId: string
}

@Component({
  components: {
    ConnectionSelect,
    TrafficStatistics,
    TimeRangeSelect,
  },
})
export default class TrafficMonitor extends Vue {
  @Getter('currentTheme') private currentTheme!: Theme

  private receivedBytesLastTime: string = ''
  private receivedBytes: number = 0
  private sentBytes: number = 0
  private receivedRateLastTime: string = ''
  private receivedRate: number = 0
  private sentRate: number = 0

  private selectedConnectionId: string = ''
  private subscription: Subscription | null = null
  private messageQueue: MessageQueue<StoreMessageModel> | null = null

  private timeRange: [string, string] = [time.getDateBefore(24 * 60), time.getNowDate()]

  /**
   * Update traffic rate
   */
  private updateTrafficRate(currentMetric: MetricsModel) {
    const previousMetric = {
      label: this.receivedBytesLastTime,
      received: this.receivedBytes,
      sent: this.sentBytes,
    }

    const rates = calculateTrafficRates([previousMetric, currentMetric])
    if (rates.length === 0) return

    const rate = rates[0]
    this.receivedRateLastTime = currentMetric.label
    this.receivedRate = rate.received
    this.sentRate = rate.sent

    this.updateRateChart()
  }

  /**
   * Update accumulated traffic
   */
  private updateTrafficBytes(metric: MetricsModel) {
    this.receivedBytesLastTime = metric.label
    this.receivedBytes = metric.received
    this.sentBytes = metric.sent

    this.updateBytesChart()
  }

  /**
   * Update rate chart
   */
  private updateRateChart() {
    const rateRef = this.$refs.trafficStatsRate as TrafficStatistics
    this.$nextTick(() => {
      if (rateRef) rateRef.updateChart()
    })
  }

  /**
   * Update bytes chart
   */
  private updateBytesChart() {
    const statsRef = this.$refs.trafficStatsBytes as TrafficStatistics
    this.$nextTick(() => {
      if (statsRef) statsRef.updateChart()
    })
  }

  /**
   * Handle new traffic metrics data
   */
  private handleMetricsUpdate(messages: StoreMessageModel[]) {
    const currentConnectionMessages = this.filterCurrentConnectionMessages(messages)
    if (currentConnectionMessages.length === 0) return

    const metrics = transformTrafficMessages(currentConnectionMessages)
    if (metrics.length === 0) return

    metrics.forEach((metric) => {
      this.updateTrafficRate(metric)
      this.updateTrafficBytes(metric)
    })
  }

  /**
   * Filter messages for current connection
   */
  private filterCurrentConnectionMessages(messages: StoreMessageModel[]): StoreMessageModel[] {
    return messages.filter((msg) => msg.connectionId === this.selectedConnectionId)
  }

  /**
   * Reset traffic statistics
   */
  private resetTrafficStats() {
    this.receivedBytesLastTime = ''
    this.receivedBytes = 0
    this.sentBytes = 0
    this.receivedRateLastTime = ''
    this.receivedRate = 0
    this.sentRate = 0

    this.$nextTick(() => {
      const rateRef = this.$refs.trafficStatsRate as TrafficStatistics
      const statsRef = this.$refs.trafficStatsBytes as TrafficStatistics
      if (rateRef) rateRef.resetChart()
      if (statsRef) statsRef.resetChart()
    })
  }

  /**
   * Handle connection change
   */
  private handleConnectionChange(connectionId: string) {
    this.selectedConnectionId = connectionId
    this.resetTrafficStats()
    this.loadBrokerTrafficMetrics(connectionId)
  }

  /**
   * Load historical traffic data
   */
  private async loadBrokerTrafficMetrics(connectionId: string) {
    if (!connectionId) return

    try {
      const { messageService } = useServices()
      const [startTime, endTime] = this.timeRange
      const trafficMessages = await messageService.getMessagesByTopicPattern<MetricsModel>(
        connectionId,
        '$SYS/brokers/%/metrics/bytes/%',
        {
          startTime,
          endTime,
          transform: transformTrafficMessages,
        },
      )
      if (trafficMessages.length === 0) {
        this.resetTrafficStats()
        return
      }
      this.initializeCharts(trafficMessages)
    } catch (error) {
      this.$log.error(`Traffic Monitor: Failed to load traffic messages: ${error}`)
    }
  }

  /**
   * Initialize chart data
   */
  private initializeCharts(trafficMessages: MetricsModel[]) {
    const rates = calculateTrafficRates(trafficMessages)

    this.$nextTick(() => {
      // Initialize rate chart
      if (rates.length > 0) {
        const rateRef = this.$refs.trafficStatsRate as TrafficStatistics
        if (rateRef) {
          const lastRate = rates[rates.length - 1]
          this.receivedRateLastTime = lastRate.label
          this.receivedRate = lastRate.received
          this.sentRate = lastRate.sent
          rateRef.setDefaultChartData(rates)
        }
      }

      // Initialize bytes chart
      const statsRef = this.$refs.trafficStatsBytes as TrafficStatistics
      if (statsRef) {
        const lastMetrics = trafficMessages[trafficMessages.length - 1]
        this.receivedBytesLastTime = lastMetrics.label
        this.receivedBytes = lastMetrics.received
        this.sentBytes = lastMetrics.sent
        statsRef.setDefaultChartData(trafficMessages)
      }
    })
  }

  /**
   * Handle packet receive
   */
  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish') return
    const publishPacket = packet as IPublishPacket
    const message: MessageModel = this.createMessage(publishPacket)
    this.messageQueue?.queueMessage({ ...message, connectionId: connectionInfo.id as string })
  }

  /**
   * Create message object
   */
  private createMessage(packet: IPublishPacket): MessageModel {
    return {
      id: getMessageId(),
      topic: packet.topic,
      payload: packet.payload.toString(),
      createAt: time.getNowDate(),
      out: false,
      qos: packet.qos,
      retain: packet.retain,
    }
  }

  /**
   * Store messages to database
   */
  private async storeMessages(storeMessages: StoreMessageModel[]) {
    const { messageService } = useServices()
    const messagesByConnection = new Map<string, MessageModel[]>()

    storeMessages.forEach((msg) => {
      const { connectionId, ...message } = msg
      const list = messagesByConnection.get(connectionId) || []
      list.push(message)
      messagesByConnection.set(connectionId, list)
    })

    for (const [connectionId, messages] of messagesByConnection) {
      try {
        await messageService.pushMsgsToConnection(messages, connectionId)
        this.$log.info(`Traffic Monitor: Saved ${messages.length} messages for connection ${connectionId}`)
      } catch (error) {
        this.$log.error(`Traffic Monitor: Failed to save messages for connection ${connectionId}: ${error}`)
      }
    }
  }

  /**
   * Subscribe to message queue
   */
  private async subscribeMessageQueue() {
    this.subscription = this.messageQueue?.getMessageObservable().subscribe(async (messages) => {
      await this.storeMessages(messages)
      this.handleMetricsUpdate(messages)
    }) as Subscription | null
  }

  private async created() {
    await this.loadBrokerTrafficMetrics(this.selectedConnectionId)
    this.messageQueue = new MessageQueue<StoreMessageModel>(1000)
    globalEventBus.on('packetReceive', this.handlePacketReceive)
    if (!this.subscription) {
      this.subscribeMessageQueue()
    }
  }

  private beforeDestroy() {
    globalEventBus.off('packetReceive', this.handlePacketReceive)
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }

  private handleTimeRangeChange(val: [string, string] | null) {
    if (val) {
      this.timeRange = val
    } else {
      this.timeRange = [time.getDateBefore(24 * 60), time.getNowDate()]
    }
    this.resetTrafficStats()
    this.loadBrokerTrafficMetrics(this.selectedConnectionId)
  }
}
</script>

<style lang="scss">
.traffic-monitor-view {
  .traffic-monitor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .iconfont {
      color: var(--color-text-default);
      cursor: pointer;
    }
  }
}
</style>
