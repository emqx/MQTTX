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
import { getTrafficMetrics } from '@/utils/systemTopic'
import useServices from '@/database/useServices'
import time from '@/utils/time'
import { Subscription } from 'rxjs'
import { MessageQueue } from '@/utils/messageQueue'
import { getMessageId } from '@/utils/idGenerator'

interface StoreMessageModel extends MessageModel {
  connectionId: string
}

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
  private subscription: Subscription | null = null
  private messageQueue: MessageQueue<StoreMessageModel> | null = null

  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish') return
    const publishPacket = packet as IPublishPacket
    const message: MessageModel = this.createMessage(publishPacket)
    this.messageQueue?.queueMessage({ ...message, connectionId: connectionInfo.id as string })
    if (connectionInfo.id !== this.selectedConnectionId) return
    const trafficMetrics = getTrafficMetrics(message, {
      label: this.receivedTime,
      received: this.receivedBytes,
      sent: this.sentBytes,
    })
    if (trafficMetrics) {
      const { label, received, sent } = trafficMetrics
      this.receivedTime = label
      if (received) {
        this.receivedBytes = received
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
        this.loadTrafficMessages(connectionId)
      }
    })
  }

  private async loadTrafficMessages(connectionId: string) {
    if (!connectionId) return
    const { messageService } = useServices()
    const startTime = time.getDateBefore(24 * 60)
    const endTime = time.getNowDate()
    try {
      const trafficMessages = await messageService.getTrafficMessagesByConnection(connectionId, startTime, endTime)
      if (trafficMessages.length === 0) return
      this.$nextTick(() => {
        const statsRef = this.$refs.trafficStats as TrafficStatistics
        if (statsRef) {
          const lastMetrics = trafficMessages[trafficMessages.length - 1]
          if (lastMetrics.label) {
            this.receivedTime = lastMetrics.label
          }
          if (lastMetrics.received) {
            this.receivedBytes = lastMetrics.received
          }
          if (lastMetrics.sent) {
            this.sentBytes = lastMetrics.sent
          }
          statsRef.setDefaultChartData(trafficMessages)
        }
      })
    } catch (error) {
      this.$log.error(`Traffic Monitor: Failed to load traffic messages: ${error}`)
    }
  }

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

  private async subscribeMessageQueue() {
    this.subscription = this.messageQueue?.getMessageObservable().subscribe(async (messages) => {
      await this.storeMessages(messages)
    }) as Subscription | null
  }

  private async created() {
    await this.loadTrafficMessages(this.selectedConnectionId)
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
