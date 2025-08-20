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
          <el-button size="small" @click="expandAll" icon="el-icon-arrow-down" :disabled="data.length === 0">
          </el-button>
        </el-tooltip>
        <el-tooltip
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          placement="top"
          :content="$t('viewer.collapseAll')"
          :open-delay="500"
        >
          <el-button size="small" @click="collapseAll" icon="el-icon-arrow-up" :disabled="data.length === 0">
          </el-button>
        </el-tooltip>
        <el-dropdown class="tree-operations" trigger="click" @command="handleCommand">
          <el-button size="small" class="more-btn">
            <i class="iconfont icon-more"></i>
          </el-button>
          <el-dropdown-menu class="tree-oper-item" slot="dropdown">
            <el-dropdown-item command="visualizeTree" :disabled="data.length === 0">
              <i class="el-icon-pie-chart"></i>{{ $t('viewer.visualizeTree') }}
            </el-dropdown-item>
            <el-dropdown-item command="syncConnection">
              <i class="iconfont icon-refresh"></i>{{ $t('viewer.syncConnection') }}
            </el-dropdown-item>
            <el-dropdown-item class="delete-item" command="clearTree" divided>
              <i class="iconfont icon-clear-history"></i>{{ $t('viewer.clearTopicTree') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <el-tree
      ref="tree"
      :data="data"
      :props="defaultProps"
      node-key="id"
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
            <el-tooltip
              :content="
                data.connectionInfo && data.connectionInfo.name
                  ? `${data.connectionInfo.name}@${node.label}`
                  : node.label
              "
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :disabled="!isTextOverflow(data, node)"
              :open-delay="500"
            >
              <span class="tree-node-label" :ref="`treeLabel_${data.id}`">
                <span v-if="data.connectionInfo && data.connectionInfo.name">{{ data.connectionInfo.name }}@</span
                >{{ node.label }}
              </span>
            </el-tooltip>
            <el-tag v-if="data.message && !checkPayloadEmpty(data.message.payload)" size="mini" class="value-tag ml-2">
              {{ data.message.payload }}
            </el-tag>
          </span>
          <span class="tree-node-meta">
            <span v-if="data.subTopicCount">{{ data.subTopicCount }} sub-topics</span>
            <span v-if="data.messageCount" class="ml-2">{{ data.messageCount }} msgs</span>
          </span>
        </span>
      </template>
    </el-tree>
    <my-dialog
      top="30px"
      :fullscreen="true"
      :visible.sync="visualizeTreeDialogVisible"
      :title="$t('viewer.visualizeTree')"
      width="96%"
      class="visualize-tree-dialog"
      :btn-disabled="true"
      @close="handleVisualizeTreeDialogClose"
      @open="handleVisualizeTreeDialogOpen"
    >
      <el-select size="small" v-model="selectedTreeRoot" class="my-3 ml-3" :style="{ width: '250px' }">
        <el-option
          v-for="node in data"
          :key="node.id"
          :label="`${node.connectionInfo.name}@${node.label}`"
          :value="node.id"
        >
        </el-option>
      </el-select>
      <el-input-number
        controls-position="right"
        class="ml-3"
        v-model="defaultExpandLevel"
        :min="0"
        size="small"
        @change="handleExpandLevelChange"
      ></el-input-number>
      <span class="visualize-tree-about">
        <el-tooltip
          :content="$t('viewer.visualizeTreeTooltip')"
          placement="top"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
        >
          <i class="iconfont icon-about"></i>
        </el-tooltip>
      </span>
      <tree-visual
        v-if="selectedTreeData"
        id="tree-view"
        :data="selectedTreeData"
        :defaultExpandLevel="defaultExpandLevel"
        style="height: calc(100vh - 230px)"
        :tooltipFormatter="tooltipFormatter"
      />
    </my-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { Tree } from 'element-ui'
import { getAllIDs, isPayloadEmpty } from '@/utils/topicTree'
import MyDialog from '@/components/MyDialog.vue'
import TreeVisual from '@/components/charts/TreeVisual.vue'

@Component({
  components: {
    MyDialog,
    TreeVisual,
  },
})
export default class TreeView extends Vue {
  @Prop({ default: () => [] }) public data!: TopicTreeNode[]

  @Getter('currentTheme') private currentTheme!: Theme

  private expandedKeys: string[] = []
  private filterText = ''
  private visualizeTreeDialogVisible = false
  private selectedTreeRoot: string | null = null
  private defaultExpandLevel: number = 4

  get selectedTreeData(): EChartsTreeNode | null {
    if (!this.selectedTreeRoot) {
      return null
    }
    const selectedTree = this.data.find((tree) => tree.id === this.selectedTreeRoot)
    return selectedTree ? this.convertToEChartsFormat(selectedTree) : null
  }

  private transformTreeAncestors(treeAncestors: { name: string }[]) {
    return treeAncestors
      .filter((ancestor, index) => ancestor.name !== '' && index !== 1)
      .map((ancestor) => ancestor.name)
      .join('/')
  }

  private tooltipFormatter(params: Record<string, any>): string {
    if (!params.data) {
      return `<div>Label: ${params.name}</div>`
    }

    const { data, treeAncestors } = params
    const tooltipParts = []

    if (treeAncestors) {
      tooltipParts.push(
        `<div>Full Topic: <span class="tooltip-topic-value">${this.transformTreeAncestors(treeAncestors)}</span></div>`,
      )
    }

    tooltipParts.push(
      `<div>Label: <span class="tooltip-topic-value">${data.label}</span></div>`,
      `<div>Messages: <span class="tooltip-topic-value">${data.messageCount}</span></div>`,
      `<div>Sub-topics: <span class="tooltip-topic-value">${data.subTopicCount}</span></div>`,
    )

    if (data.message) {
      const maxLength = 50
      const payload = data.message.payload
      const truncatedPayload = payload.length > maxLength ? `${payload.slice(0, maxLength)}...` : payload
      tooltipParts.push(
        `<div>Last payload: <span class="tooltip-topic-value">${truncatedPayload}</span></div>`,
        `<div>Received Time: <span class="tooltip-topic-value">${data.message.createAt}</span></div>`,
      )
    }

    return tooltipParts.join('')
  }

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

  private filterNode(value: string, data: TopicTreeNode) {
    if (!value) return true
    return data.label.toLowerCase().indexOf(value.toLowerCase()) !== -1
  }

  private handleNodeClick(data: TopicTreeNode) {
    this.$emit('node-click', data)
  }

  private handleNodeExpand(data: TopicTreeNode) {
    if (!this.expandedKeys.includes(data.id)) {
      this.expandedKeys.push(data.id)
    }
  }

  private handleNodeCollapse(data: TopicTreeNode) {
    this.removeExpandedKeysRecursively(data)
  }

  private removeExpandedKeysRecursively(node: TopicTreeNode) {
    const index = this.expandedKeys.indexOf(node.id)
    if (index > -1) {
      this.expandedKeys.splice(index, 1)
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => this.removeExpandedKeysRecursively(child))
    }
  }

  private expandAll() {
    this.expandedKeys = getAllIDs(this.data)
  }

  private collapseAll() {
    const collapseNode = (node: TopicTreeNode) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach(collapseNode)
      }
      const treeNode = this.treeRef.getNode(node.id)
      if (treeNode) {
        treeNode.expanded = false
      }
    }
    this.data.forEach(collapseNode)
    this.expandedKeys = []
  }

  private checkPayloadEmpty(payload: string | Buffer | null | undefined): boolean {
    return isPayloadEmpty(payload)
  }

  private isTextOverflow(data: TopicTreeNode, node: any): boolean {
    // Check if text is likely to overflow based on content length
    const fullText =
      data.connectionInfo && data.connectionInfo.name ? `${data.connectionInfo.name}@${node.label}` : node.label
    // Rough estimate: if text is longer than 50 characters, it's likely to overflow
    return fullText.length > 50
  }

  private handleCommand(command: string) {
    switch (command) {
      case 'clearTree':
        this.clearTree()
        break
      case 'visualizeTree':
        this.selectedTreeRoot = this.data.length > 0 ? this.data[0].id : null
        this.visualizeTreeDialogVisible = true
        break
      case 'syncConnection':
        this.syncConnection()
        break
    }
  }

  private convertToEChartsFormat(node: TopicTreeNode): EChartsTreeNode {
    const result: EChartsTreeNode = {
      name: node.label,
      id: node.id,
      label: node.label,
      messageCount: node.messageCount || 0,
      subTopicCount: node.subTopicCount || 0,
      message: node.message,
    }

    if (node.children && node.children.length > 0) {
      result.children = node.children.map((child) => this.convertToEChartsFormat(child))
    }

    return result
  }

  private clearTree() {
    this.$emit('clear-tree')
  }

  private syncConnection() {
    this.$emit('sync-connection')
  }

  private handleVisualizeTreeDialogClose() {
    this.selectedTreeRoot = null
  }

  private handleVisualizeTreeDialogOpen() {
    const expandLevel = localStorage.getItem('tree-view-expand-level')
    this.defaultExpandLevel = expandLevel ? parseInt(expandLevel) : 4
  }

  private handleExpandLevelChange(val: number) {
    localStorage.setItem('tree-view-expand-level', val.toString())
  }

  private mounted() {
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
@import '@/assets/scss/mixins.scss';

@include el-dropdown-menu-common;

.tree-view {
  .tree-view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .tree-view-header-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      .tree-operations {
        margin-left: 10px;
        .more-btn {
          .iconfont {
            font-size: 12px;
            position: relative;
            top: 2px;
          }
        }
      }
      .el-button,
      .el-button.is-disabled {
        border: 1px solid var(--color-border-default);
        background: transparent;
        color: var(--color-text-default);
        &:not(.is-disabled) {
          &:hover {
            border: 1px solid var(--color-main-green);
            color: var(--color-main-green);
          }
        }
      }
      .el-button.is-disabled {
        color: var(--color-text-light);
      }
      .el-button.clear-btn:not(.is-disabled):hover {
        border: 1px solid var(--color-minor-red);
        color: var(--color-minor-red);
      }
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
      flex-shrink: 0;
      margin-left: 8px;
    }
    .tree-node-info {
      display: flex;
      align-items: center;
      min-width: 0;
      flex: 1;
      overflow: hidden;
      .tree-node-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
        flex: 1;
      }
      .value-tag {
        max-width: 200px;
        width: auto;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-shrink: 0;
        margin-left: 8px;
      }
    }
  }
  .el-tree-node__children {
    padding-left: 12px;
    width: 100%;
  }
  .el-tree__empty-text {
    color: var(--color-text-light);
  }
}

.visualize-tree-dialog {
  .el-dialog__body {
    padding: 0px;
  }
  .tooltip-topic-value {
    color: var(--color-text-light);
  }
  .visualize-tree-about {
    color: var(--color-text-default);
    margin-left: 12px;
    cursor: pointer;
  }
}
</style>
