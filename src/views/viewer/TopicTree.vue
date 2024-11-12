<template>
  <div class="topic-tree-view">
    <el-row :gutter="12">
      <el-col :span="16">
        <el-card shadow="never" class="topic-tree-card">
          <TreeView
            :data="data"
            @node-click="handleNodeClick"
            @clear-tree="handleClearTree"
            @sync-connection="syncConnectionDialogVisible = true"
          />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="topic-info-card">
          <TreeNodeInfo v-if="selectedNode" :node="selectedNode" :tree-data="data" />
          <div v-else class="empty-text">{{ $t('viewer.selectedTopicInfo') }}</div>
        </el-card>
      </el-col>
    </el-row>
    <sync-topic-tree-dialog :visible.sync="syncConnectionDialogVisible" @success="handleSyncConnectionSuccess" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'
import TreeView from '@/widgets/TreeView.vue'
import { updateTopicTreeNode } from '@/utils/topicTree'
import { Packet } from 'mqtt-packet/types'
import TreeNodeInfo from '@/widgets/TreeNodeInfo.vue'
import { MessageQueue } from '@/utils/messageQueue'
import useServices from '@/database/useServices'
import { Subscription } from 'rxjs'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import MyDialog from '@/components/MyDialog.vue'
import SyncTopicTreeDialog from '@/widgets/SyncTopicTreeDialog.vue'
import { ignoreQoS0Message } from '@/utils/mqttUtils'

@Component({
  components: {
    TreeView,
    TreeNodeInfo,
    ConnectionSelect,
    MyDialog,
    SyncTopicTreeDialog,
  },
})
export default class TopicTree extends Vue {
  private data: TopicTreeNode[] = []

  private selectedNode: TopicTreeNode | null = null
  private subscription: Subscription | null = null
  private messageQueue: MessageQueue<TopicTreeNode[]> | null = null

  private syncConnectionDialogVisible = false

  private handleNodeClick(data: TopicTreeNode) {
    this.selectedNode = data
  }

  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
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
    if (ignoreQoS0Message(packet.qos)) return
    this.messageQueue?.queueMessage(updatedNodes)
  }

  private async loadTopicTree() {
    const { topicNodeService } = useServices()
    try {
      const res = await topicNodeService.getTree()
      this.data = res
    } catch (error) {
      this.$message.error(`Failed to get topic tree: ${(error as Error).toString()}`)
      this.$log.error(`Topic Tree: Failed to get topic tree: ${(error as Error).toString()}`)
    }
  }

  private async updateTopicNodes(updatedNodes: TopicTreeNode[][]) {
    if (updatedNodes.length === 0) return
    const { topicNodeService } = useServices()
    for (const topicNodes of updatedNodes) {
      try {
        if (topicNodes.length === 0) return
        const { savedEntitiesCount, savedMessagesCount } = await topicNodeService.saveTopicNodesWithMessages(topicNodes)
        this.$log.info(
          `Topic Tree: Successfully saved ${savedEntitiesCount} topic nodes and ${savedMessagesCount} messages`,
        )
      } catch (error) {
        this.$log.error(`Topic Tree: Failed to save topic nodes or messages: ${(error as Error).toString()}`)
      }
    }
  }

  private async subscribeMessageQueue() {
    this.subscription = this.messageQueue?.getMessageObservable().subscribe(async (updatedNodes) => {
      await this.updateTopicNodes(updatedNodes)
    }) as Subscription | null
  }

  public async handleClearTree() {
    this.$confirm(
      `${this.$tc('viewer.clearTopicTreeConfirm')}\n${this.$tc('viewer.clearTopicTreeNotEffectConnList')}`,
      this.$tc('common.warning'),
      {
        confirmButtonText: this.$tc('common.confirm'),
        cancelButtonText: this.$tc('common.cancel'),
        type: 'warning',
      },
    ).then(async () => {
      const { topicNodeService } = useServices()
      try {
        await topicNodeService.clearTree()
        this.loadTopicTree()
        this.selectedNode = null
        this.$message.success(this.$tc('viewer.clearTopicTreeSuccess'))
        this.$log.info('Topic Tree: Successfully clear all topic tree')
      } catch (error) {
        this.$log.error(`Topic Tree: Failed to clear topic tree: ${(error as Error).toString()}`)
      }
    })
  }

  private handleSyncConnectionSuccess(syncedTopicTree: TopicTreeNode) {
    const findIndex = this.data.findIndex((topicTreeNode) => topicTreeNode.id === syncedTopicTree.id)
    if (findIndex !== -1) {
      this.$set(this.data, findIndex, syncedTopicTree)
    } else {
      this.data.push(syncedTopicTree)
    }
  }

  private async created() {
    await this.loadTopicTree()
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
    .empty-text {
      color: var(--color-text-light);
    }
  }
  .delete-btn:not(.is-disabled) {
    color: var(--color-minor-red);
    border-color: var(--color-minor-red);
    background-color: transparent;
  }
}
.sync-connection-dialog {
  .sync-connection-tip {
    margin-top: 12px;
    word-break: break-word;
  }
}
</style>
