<template>
  <div class="topic-tree-view">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" class="topic-tree-card">
          <el-input :placeholder="$t('viewer.filterDesc')" size="small" v-model="filterText" class="mb-3" />
          <el-tree
            ref="tree"
            :data="data"
            :props="defaultProps"
            @node-click="handleNodeClick"
            :filter-node-method="filterNode"
          ></el-tree>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="topic-info-card">
          {{ selectedTopic }}
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { globalEventBus } from '@/utils/globalEventBus'
import { Tree } from 'element-ui'

@Component
export default class TopicTree extends Vue {
  @Watch('filterText')
  private filterTextChange(val: string) {
    this.tree.filter(val)
  }

  get tree() {
    return this.$refs.tree as Tree
  }

  private selectedTopic = ''
  private filterText = ''
  private data = [
    {
      label: 'testtopic',
      children: [
        {
          label: 'device1',
          children: [
            {
              label: 'temperature',
            },
            {
              label: 'humidity',
            },
          ],
        },
      ],
    },
    {
      label: '$SYS',
      children: [
        {
          label: 'broker',
          children: [
            {
              label: 'emqx@127.0.0.1',
            },
          ],
        },
      ],
    },
    {
      label: 'test',
    },
  ]

  private defaultProps = {
    children: 'children',
    label: 'label',
  }

  private handlePacketReceive = (packet: any, connectionInfo: ConnectionModel) => {
    console.log(packet, connectionInfo)
  }

  private filterNode(value: string, data: any) {
    if (!value) return true
    return data.label.indexOf(value) !== -1
  }

  private handleNodeClick(data: Record<string, any>) {
    this.selectedTopic = data.label
  }

  created() {
    globalEventBus.on('packetReceive', this.handlePacketReceive)
  }

  beforeDestroy() {
    globalEventBus.off('packetReceive', this.handlePacketReceive)
  }
}
</script>

<style lang="scss">
.topic-tree-view {
  .topic-tree-card {
    min-height: 500px;
  }
  .topic-info-card {
    min-height: 320px;
  }
  .el-tree {
    background: transparent;
  }
}
</style>
