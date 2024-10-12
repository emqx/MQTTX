<template>
  <div class="tree-view">
    <div class="tree-view-header">
      <el-input :placeholder="$t('viewer.filterDesc')" size="small" v-model="filterText" class="mb-3" />
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
            <span v-if="data.name"> - [{{ data.name }}]</span>
            <el-tag v-if="data.latestMessage" size="mini" class="ml-2">{{ data.latestMessage }}</el-tag>
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
import { Tree } from 'element-ui'

@Component
export default class TreeView extends Vue {
  @Prop({ default: () => [] }) public data!: TopicTreeData[]

  private expandedKeys: string[] = []
  private filterText = ''

  get treeRef(): Tree {
    return this.$refs.tree as Tree
  }

  @Watch('filterText')
  private filterTextChange(val: string) {
    this.treeRef.filter(val)
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
}
</script>

<style lang="scss">
.tree-view {
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
    .tree-node-meta {
      color: var(--color-text-light);
    }
  }

  .el-tree-node__children {
    padding-left: 12px;
  }
}
</style>
