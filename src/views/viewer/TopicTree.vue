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
import { updateTopicTreeNode, groupedMessagesByConnectionID } from '@/utils/topicTree'
import { IPublishPacket } from 'mqtt-packet/types'
import TreeNodeInfo from '@/components/widgets/TreeNodeInfo.vue'
import { ignoreQoS0Message } from '@/utils/mqttUtils'
import { MessageQueue } from '@/utils/messageQueue'
import useServices from '@/database/useServices'
import { Subscription } from 'rxjs'
import { getMessageId } from '@/utils/idGenerator'

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
  private messageQueue: MessageQueue<TopicTreeNode[]> | null = null

  private handleNodeClick(data: TopicTreeNode) {
    this.selectedNode = data
  }

  private handlePacketReceive(packet: IPublishPacket, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish') return
    const { updatedNodes, updatedTree } = updateTopicTreeNode(this.data, {
      packet,
      connectionInfo,
    })
    // Handle Tree View Update
    this.data = updatedTree
    if (this.data.length === 0) return
    this.$log.info(
      `Topic Tree: Updated tree data for connection ${connectionInfo.name}@${connectionInfo.host}. Topic: ${
        packet.topic
      }, QoS: ${packet.qos}${packet.payload ? `, Payload: ${packet.payload.toString()}` : ''}`,
    )
    // Handle Tree Data Update
    this.messageQueue?.queueMessage(updatedNodes)
  }

  private filterQos0Messages(messages: MessageModel[]) {
    return messages.filter((message) => !ignoreQoS0Message(message.qos))
  }

  private async saveMqttMessages(messages: MessageModel[], connectionId: string) {
    if (messages.length === 0) return
    const { messageService } = useServices()
    return messageService.importMsgsToConnection(messages, connectionId)
  }

  private async updateTopicNodes(topicNodes: TopicTreeNode[]) {
    topicNodes.forEach((node) => {
      if (node.message) {
        console.log(node.message.id)
      }
    })
  }

  private async subscribeMessageQueue() {
    this.subscription = this.messageQueue?.getMessageObservable().subscribe(async (updatedNodes) => {
      const messagesByConnection = groupedMessagesByConnectionID(updatedNodes)
      for (const [connectionId, messages] of messagesByConnection) {
        try {
          const filteredMessages = this.filterQos0Messages(messages)
          await this.saveMqttMessages(filteredMessages, connectionId)
          this.$log.info(
            `Topic Tree: Successfully saved ${filteredMessages.length} messages to connection ${connectionId}`,
          )
        } catch (error) {
          this.$log.error(
            `Topic Tree: Failed to save messages to connection ${connectionId}: ${(error as Error).toString()}`,
          )
        }
      }
      updatedNodes.forEach((node) => {
        this.updateTopicNodes(node)
      })
    }) as Subscription | null
  }

  private created() {
    this.messageQueue = new MessageQueue<TopicTreeNode[]>()
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
