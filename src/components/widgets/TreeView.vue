<template>
  <div class="tree-view">
    <div class="tree-view-header mb-3">
      <el-input :placeholder="$t('viewer.filterDesc')" size="small" v-model="filterText" clearable class="mr-3" />
      <div class="tree-view-header-actions">
        <el-tooltip
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          placement="top"
          :content="$t('viewer.expendAll')"
          :open-delay="500"
        >
          <el-button size="small" @click="expandAll" icon="el-icon-arrow-down"> </el-button>
        </el-tooltip>
        <el-tooltip
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          placement="top"
          :content="$t('viewer.collapseAll')"
          :open-delay="500"
        >
          <el-button size="small" @click="collapseAll" icon="el-icon-arrow-up"> </el-button>
        </el-tooltip>
      </div>
    </div>
    <el-tree
      ref="tree"
      :data="data"
      :props="defaultProps"
      node-key="label"
      :default-expanded-keys="expandedKeys"
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      :filter-node-method="filterNode"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span class="tree-node-info">
            <span>{{ node.label }}</span>
            <span v-if="data.connectionInfo && data.connectionInfo.name">
              &nbsp;- [{{ data.connectionInfo.name }}]
            </span>
            <el-tag v-if="data.latestMessage" size="mini" class="value-tag ml-2">
              {{ data.latestMessage }}
            </el-tag>
          </span>
          <span class="tree-node-meta">
            <span v-if="data.subTopicCount">{{ data.subTopicCount }} sub-topics</span>
            <span v-if="data.messageCount" class="ml-2">{{ data.messageCount }} msgs</span>
          </span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { Tree } from 'element-ui'
import { getAllLabels } from '@/utils/topicTree'

@Component
export default class TreeView extends Vue {
  @Prop({ default: () => [] }) public data!: TopicTreeData[]

  @Getter('currentTheme') private currentTheme!: Theme

  private expandedKeys: string[] = []
  private filterText = ''

  get treeRef(): Tree {
    return this.$refs.tree as Tree
  }

  @Watch('filterText')
  private filterTextChange(val: string) {
    this.$nextTick(() => {
      this.treeRef.filter(val)
    })
  }

  @Watch('data', { deep: true })
  private onDataChange() {
    this.$nextTick(() => {
      // Keep the filter text when data changes
      if (this.filterText) {
        this.treeRef.filter(this.filterText)
      }
    })
  }

  private defaultProps = {
    children: 'children',
    label: 'label',
  }

  private filterNode(value: string, data: TopicTreeData) {
    if (!value) return true
    return data.label.toLowerCase().indexOf(value.toLowerCase()) !== -1
  }

  private handleNodeClick(data: TopicTreeData) {
    this.$emit('node-click', data)
  }

  private handleNodeExpand(data: TopicTreeData) {
    if (!this.expandedKeys.includes(data.label)) {
      this.expandedKeys.push(data.label)
    }
  }

  private handleNodeCollapse(data: TopicTreeData) {
    this.removeExpandedKeysRecursively(data)
  }

  private removeExpandedKeysRecursively(node: TopicTreeData) {
    const index = this.expandedKeys.indexOf(node.label)
    if (index > -1) {
      this.expandedKeys.splice(index, 1)
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => this.removeExpandedKeysRecursively(child))
    }
  }

  private expandAll() {
    this.expandedKeys = getAllLabels(this.data)
  }

  private collapseAll() {
    this.expandedKeys = []
  }
  mounted() {
    // Keep the filter text when data changes
    this.$nextTick(() => {
      if (this.filterText) {
        this.treeRef.filter(this.filterText)
      }
    })
  }
}
</script>

<style lang="scss">
.tree-view {
  .tree-view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    .tree-view-header-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .el-tree-node__content {
    border-radius: 8px;
    height: 32px;
    line-height: 32px;
    padding-left: 0px !important;
  }
  .el-tree-node__content:hover,
  .el-tree-node:focus > .el-tree-node__content {
    background-color: var(--color-bg-item);
  }
  .el-tree-node__content > .el-tree-node__expand-icon {
    padding: 6px;
  }
  .custom-tree-node {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-right: 6px;
    min-width: 0;
    .tree-node-meta {
      color: var(--color-text-light);
    }
    .tree-node-info {
      width: 100%;
      display: flex;
      align-items: center;
      min-width: 0;
      .value-tag {
        max-width: 75%;
        width: auto;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 0 1 auto;
        min-width: 0;
      }
    }
  }

  .el-tree-node__children {
    padding-left: 12px;
    width: 100%;
  }
}
</style>
