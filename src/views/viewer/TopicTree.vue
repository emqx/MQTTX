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
import { updateTopicTreeData } from '@/utils/topicTree'
import { IPublishPacket } from 'mqtt-packet/types'
import TreeNodeInfo from '@/components/widgets/TreeNodeInfo.vue'

@Component({
  components: {
    TreeView,
    TreeNodeInfo,
  },
})
export default class TopicTree extends Vue {
  private data: TopicTreeData[] = []

  private selectedNode: TopicTreeData | null = null

  private handlePacketReceive(packet: IPublishPacket, connectionInfo: ConnectionModel) {
    this.data = updateTopicTreeData(this.data, {
      packet,
      connectionInfo,
    })
    console.log(JSON.stringify(this.data, null, 2))
  }

  created() {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  beforeDestroy() {
    globalEventBus.off('packetReceive', this.handlePacketReceive)
  }

  private handleNodeClick(data: TopicTreeData) {
    this.selectedNode = data
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
