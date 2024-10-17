<template>
  <div class="topic-tree-view">
    <el-row :gutter="12">
      <el-col :span="16">
        <el-card shadow="never" class="topic-tree-card">
          <TreeView :data="data" @node-click="handleNodeClick" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="topic-info-card">
          <TreeNodeInfo v-if="selectedNode" :node="selectedNode" :tree-data="data" />
          <div v-else>{{ $t('viewer.selectedTopicInfo') }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'
import TreeView from '@/components/widgets/TreeView.vue'
import { updateTopicTreeNode } from '@/utils/topicTree'
import { IPublishPacket } from 'mqtt-packet/types'
import TreeNodeInfo from '@/components/widgets/TreeNodeInfo.vue'
import { ignoreQoS0Message } from '@/utils/mqttUtils'
import { messageQueue } from '@/utils/mqttMessageQueue'
import useServices from '@/database/useServices'
import { getMessageId } from '@/utils/idGenerator'
import { Subscription } from 'rxjs'
import { getNowDate } from '@/utils/time'

@Component({
  components: {
    TreeView,
    TreeNodeInfo,
  },
})
export default class TopicTree extends Vue {
  private data: TopicTreeNode[] = []

  private selectedNode: TopicTreeNode | null = null

  private subscription: Subscription | null = null

  private handleNodeClick(data: TopicTreeNode) {
    this.selectedNode = data
  }

  private handlePacketReceive(packet: IPublishPacket, connectionInfo: ConnectionModel) {
    this.data = updateTopicTreeNode(this.data, {
      packet,
      connectionInfo,
    })
    this.queueMessage(packet, connectionInfo.id as string)
    if (this.data.length === 0) return
    this.$log.info(
      `Topic Tree: Updated tree data for connection ${connectionInfo.name}@${connectionInfo.host}. Topic: ${
        packet.topic
      }, QoS: ${packet.qos}${packet.payload ? `, Payload: ${packet.payload.toString()}` : ''}`,
    )
  }

  private queueMessage(packet: IPublishPacket, id: string) {
    if (packet.cmd !== 'publish' || ignoreQoS0Message(packet.qos)) return
    messageQueue.queueMessage(packet, id)
  }

  private generateMessage(m: QueuedMessage): MessageModel {
    return {
      id: getMessageId(),
      topic: m.packet.topic,
      payload: m.packet.payload.toString(),
      qos: m.packet.qos,
      retain: m.packet.retain,
      out: false,
      createAt: getNowDate(),
      properties: m.packet.properties,
    }
  }

  private async storeMessages() {
    const { messageService } = useServices()
    this.subscription = messageQueue.getMessageObservable().subscribe(async ({ messages, connectionId }) => {
      if (messages.length === 0) return
      try {
        const processedMessages = messages.map((m) => this.generateMessage(m))
        await messageService.importMsgsToConnection(processedMessages, connectionId)
        this.$log.info(`Topic Tree: Processed and stored ${messages.length} messages for connection ${connectionId}`)
      } catch (error) {
        this.$log.error(`Topic Tree: Error processing and storing messages: ${(error as Error).toString()}`)
      }
    })
  }

  private created() {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
    if (!this.subscription) {
      this.storeMessages()
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
.topic-tree-view {
  .topic-info-card,
  .topic-tree-card {
    height: calc(100vh - 130px);
    overflow-y: auto;
    margin-bottom: 12px;
  }
  .topic-tree-card {
    color: var(--color-text-default);
    .el-tree {
      background: transparent;
      color: var(--color-text-default);
      height: 100%;
    }
  }
  .topic-info-card {
    color: var(--color-text-default);
  }
}
</style>
