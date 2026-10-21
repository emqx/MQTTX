<template>
  <div class="topic-tree-view">
    <div ref="panes" class="topic-tree-panes">
      <el-card shadow="never" class="topic-tree-card">
        <TreeView
          ref="treeView"
          :data="data"
          @node-click="handleNodeClick"
          @clear-tree="handleClearTree"
          @sync-connection="syncConnectionDialogVisible = true"
        />
      </el-card>
      <div class="pane-resizer" :class="{ 'is-resizing': isResizing }" @mousedown="handleResizeStart"></div>
      <el-card shadow="never" class="topic-info-card" :style="{ width: `${infoPaneRatio * 100}%` }">
        <TreeNodeInfo v-if="selectedNode" :node="selectedNode" :tree-data="data" />
        <div v-else class="empty-text">{{ $t('viewer.selectedTopicInfo') }}</div>
      </el-card>
    </div>
    <sync-topic-tree-dialog :visible.sync="syncConnectionDialogVisible" @success="handleSyncConnectionSuccess" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'
import { AGENT_DATA_CHANGED, AgentDataChangedPayload } from '@/utils/ai/agent/agentEvents'
import TreeView from '@/widgets/TreeView.vue'
import { updateSubTopicCounts, updateTopicTreeNode } from '@/utils/topicTree'
import { Packet } from 'mqtt-packet/types'
import TreeNodeInfo from '@/widgets/TreeNodeInfo.vue'
import { MessageQueue } from '@/utils/messageQueue'
import useServices from '@/database/useServices'
import { Subscription } from 'rxjs'
import SyncTopicTreeDialog from '@/widgets/SyncTopicTreeDialog.vue'
import { ignoreQoS0Message } from '@/utils/mqttUtils'
import { trackDrag } from '@/utils/trackDrag'

const MIN_INFO_PANE_RATIO = 0.2
const MAX_INFO_PANE_RATIO = 0.6
const INFO_PANE_RATIO_STORAGE_KEY = 'topic-tree-info-pane-ratio'

function clampRatio(ratio: number): number {
  return Math.min(Math.max(ratio, MIN_INFO_PANE_RATIO), MAX_INFO_PANE_RATIO)
}

@Component({
  components: {
    TreeView,
    TreeNodeInfo,
    SyncTopicTreeDialog,
  },
})
export default class TopicTree extends Vue {
  private data: TopicTreeNode[] = []

  private selectedNode: TopicTreeNode | null = null
  private subscription: Subscription | null = null
  private messageQueue: MessageQueue<TopicTreeNode[]> | null = null
  private pendingTopicNodes: TopicTreeNode[] = []
  private isSavingTopicNodes = false

  private syncConnectionDialogVisible = false

  private infoPaneRatio = 1 / 3
  private isResizing = false
  private stopResizing: (() => void) | null = null

  private handleNodeClick(data: TopicTreeNode) {
    this.selectedNode = data
  }

  private handleResizeStart(event: MouseEvent) {
    event.preventDefault()
    const panes = this.$refs.panes as HTMLElement | undefined
    if (!panes) return
    const { right, width } = panes.getBoundingClientRect()
    const startX = event.clientX
    this.isResizing = true
    this.stopResizing = trackDrag(
      event,
      (dx) => (this.infoPaneRatio = clampRatio((right - startX - dx) / width)),
      () => {
        this.isResizing = false
        localStorage.setItem(INFO_PANE_RATIO_STORAGE_KEY, this.infoPaneRatio.toString())
      },
    )
  }

  private stopResize() {
    this.isResizing = false
    this.stopResizing?.()
    this.stopResizing = null
  }

  private handlePacketReceive(packet: Packet, connectionInfo: ConnectionModel) {
    if (packet.cmd !== 'publish') return
    const { updatedNodes, newNodeParentId } = updateTopicTreeNode(this.data, {
      packet,
      connectionInfo,
    })
    // Only the node that gained a child needs an el-tree sync.
    if (newNodeParentId) {
      const treeView = this.$refs.treeView as TreeView | undefined
      treeView?.syncChildren(newNodeParentId)
    }
    this.$log.debug(
      `Topic Tree: Updated tree data for connection ${connectionInfo.name}@${connectionInfo.host}. Topic: ${
        packet.topic
      }, QoS: ${packet.qos}${packet.payload ? `, Payload: ${packet.payload.toString()}` : ''}`,
    )
    if (ignoreQoS0Message(packet.qos)) return
    this.messageQueue?.queueMessage(updatedNodes)
  }

  private async loadTopicTree() {
    const { topicNodeService } = useServices()
    try {
      const res = await topicNodeService.getTree()
      // Persisted counts may be stale; recompute before incremental updates.
      res.forEach((root) => updateSubTopicCounts(root))
      this.data = res
    } catch (error) {
      this.$message.error(`Failed to get topic tree: ${(error as Error).toString()}`)
      this.$log.error(`Topic Tree: Failed to get topic tree: ${(error as Error).toString()}`)
    }
  }

  private async flushTopicNodes() {
    if (this.isSavingTopicNodes) return
    this.isSavingTopicNodes = true
    const { topicNodeService } = useServices()
    try {
      while (this.pendingTopicNodes.length > 0) {
        const topicNodes = this.pendingTopicNodes
        this.pendingTopicNodes = []
        try {
          const { savedEntitiesCount, savedMessagesCount } = await topicNodeService.saveTopicNodesWithMessages(
            topicNodes,
          )
          this.$log.info(
            `Topic Tree: Successfully saved ${savedEntitiesCount} topic nodes and ${savedMessagesCount} messages`,
          )
        } catch (error) {
          this.$log.error(`Topic Tree: Failed to save topic nodes or messages: ${(error as Error).toString()}`)
        }
      }
    } finally {
      this.isSavingTopicNodes = false
    }
  }

  private async subscribeMessageQueue() {
    this.subscription = this.messageQueue?.getMessageObservable().subscribe((updatedNodes) => {
      this.pendingTopicNodes.push(...updatedNodes.flat())
      this.flushTopicNodes()
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
    // Replace the array so el-tree rebuilds instead of keeping the old host data.
    const data = [...this.data]
    const findIndex = data.findIndex((topicTreeNode) => topicTreeNode.id === syncedTopicTree.id)
    if (findIndex !== -1) {
      data[findIndex] = syncedTopicTree
    } else {
      data.push(syncedTopicTree)
    }
    this.data = data
  }

  private async created() {
    const storedRatio = parseFloat(localStorage.getItem(INFO_PANE_RATIO_STORAGE_KEY) ?? '')
    if (Number.isFinite(storedRatio)) {
      this.infoPaneRatio = clampRatio(storedRatio)
    }
    await this.loadTopicTree()
    this.messageQueue = new MessageQueue<TopicTreeNode[]>()
    globalEventBus.on('packetReceive', this.handlePacketReceive)
    globalEventBus.on(AGENT_DATA_CHANGED, this.onAgentDataChanged)
    if (!this.subscription) {
      this.subscribeMessageQueue()
    }
  }

  /** The agent synced or cleared the tree: reload it */
  private onAgentDataChanged({ domain }: AgentDataChangedPayload) {
    if (domain === 'topic-tree') this.loadTopicTree()
  }

  private beforeDestroy() {
    globalEventBus.off('packetReceive', this.handlePacketReceive)
    globalEventBus.off(AGENT_DATA_CHANGED, this.onAgentDataChanged)
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.stopResize()
  }
}
</script>

<style lang="scss">
.topic-tree-view {
  .topic-tree-panes {
    display: flex;
  }
  .topic-info-card,
  .topic-tree-card {
    height: var(--view-content-height);
    overflow-y: auto;
    margin-bottom: 12px;
    // el-card's 0.3s transition makes resizing lag behind the cursor.
    transition: none;
  }
  .topic-tree-card {
    flex: 1;
    min-width: 0;
    color: var(--color-text-default);
    .el-tree {
      background: transparent;
      color: var(--color-text-default);
      height: 100%;
    }
  }
  .topic-info-card {
    flex-shrink: 0;
    color: var(--color-text-default);
    .empty-text {
      color: var(--color-text-light);
    }
  }
  .pane-resizer {
    flex-shrink: 0;
    width: 12px;
    margin-bottom: 12px;
    cursor: col-resize;
    &::after {
      content: '';
      display: block;
      width: 2px;
      height: 100%;
      margin: 0 auto;
      transition: background-color 0.1s;
    }
    &:hover::after,
    &.is-resizing::after {
      background-color: var(--color-main-green);
    }
  }
}
</style>
