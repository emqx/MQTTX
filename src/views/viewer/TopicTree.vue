<template>
  <div class="topic-tree-view">
    <el-row :gutter="16">
      <el-col :span="14">
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
      <el-col :span="10">
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
      label: '43.123.123.123 (test-env)',
      children: [
        {
          label: 'testtopic',
          children: [
            {
              label: 'temperature',
            },
            {
              label: 'humidity',
            },
          ],
        },
        {
          label: 'test',
        },
      ],
    },
    {
      label: 'broker.emqx.io (public)',
      children: [
        {
          label: '$SYS',
          children: [
            {
              label: 'brokers',
              children: [
                {
                  label: 'emqx@127.0.0.1',
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  private defaultProps = {
    children: 'children',
    label: 'label',
  }

  private handlePacketReceive = (packet: any, connectionInfo: ConnectionModel) => {
    console.log(JSON.stringify(packet, null, 2))
    console.log(JSON.stringify(connectionInfo, null, 2))
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
