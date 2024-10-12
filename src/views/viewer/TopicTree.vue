<template>
  <div class="topic-tree-view">
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card shadow="never" class="topic-tree-card">
          <TreeView :data="data" @node-click="handleNodeClick" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="topic-info-card">
          {{ selectedNode }}
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

@Component({
  components: {
    TreeView,
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
  .topic-tree-card {
    color: var(--color-text-default);
    min-height: 500px;
    .el-tree {
      color: var(--color-text-default);
    }
  }
  .topic-info-card {
    color: var(--color-text-default);
    min-height: 320px;
  }
  .el-tree {
    background: transparent;
  }
}
</style>
