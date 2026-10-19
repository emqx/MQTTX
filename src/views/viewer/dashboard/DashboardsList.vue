<template>
  <div class="dashboard-container">
    <div class="dashboard-topbar">
      <h1 class="dashboard-titlebar">{{ $t('viewer.dashboards') }}</h1>
      <div class="dashboard-tailbar">
        <el-tooltip placement="bottom" :open-delay="500" :content="$t('viewer.createDashboard')">
          <a href="javascript:;" class="new-button" @click="createDashboard">
            <i class="iconfont icon-create-new"></i>
          </a>
        </el-tooltip>
        <el-tooltip placement="bottom" :open-delay="500" :content="$t('viewer.hideDashboards')">
          <a href="javascript:;" class="new-button" @click="$emit('toggle-list', false)">
            <i class="iconfont icon-hide-connections"></i>
          </a>
        </el-tooltip>
      </div>
    </div>
    <div class="dashboards-list">
      <el-tree
        :indent="4"
        draggable
        ref="tree"
        :data="dashboards"
        :current-node-key="selectedId"
        node-key="id"
        highlight-current
        @node-drop="handleDrop"
        @node-click="handleNodeClick"
        :allow-drop="allowDrop"
        :allow-drag="allowDrag"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <div class="dashboard-item" :title="rowTitle(data)">
              <span class="dashboard-name">{{ data.name }}</span>
              <el-dropdown
                class="dashboard-oper"
                trigger="click"
                @command="onRowCommand($event, data)"
                @click.native.stop
              >
                <span class="dashboard-oper-trigger" @click.stop @mousedown.stop="onOperPointerDown">
                  <i class="iconfont icon-more"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">
                    <i class="iconfont icon-edit"></i>{{ $t('common.edit') }}
                  </el-dropdown-item>
                  <el-dropdown-item class="delete-item" command="delete">
                    <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import '@/assets/font/iconfont'

@Component
export default class DashboardsList extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly dashboards!: DashboardModel[]
  @Prop({ type: String, default: null }) readonly selectedId!: string | null

  /**
   * True while a press that started on the ⋯ button is still held, so the tree
   * does not turn that press into a row drag (see `allowDrag`).
   */
  private operPointerActive = false

  private selectDashboard(dashboard: DashboardModel) {
    this.$emit('dashboard-selected', dashboard)
  }

  private createDashboard() {
    this.$emit('create-dashboard')
  }

  /** Row menu: the two commands keep the old context-menu event contract. */
  private onRowCommand(command: string, dashboard: DashboardModel): void {
    if (command === 'edit') {
      this.$emit('edit-dashboard', dashboard)
    } else if (command === 'delete') {
      this.$emit('delete-dashboard', dashboard)
    }
  }

  private onOperPointerDown(): void {
    this.operPointerActive = true
  }

  private onDocumentMouseUp(): void {
    this.operPointerActive = false
  }

  private mounted() {
    document.addEventListener('mouseup', this.onDocumentMouseUp)
  }

  private beforeDestroy() {
    document.removeEventListener('mouseup', this.onDocumentMouseUp)
  }

  /**
   * Native tooltip for a row: the description is only shown on hover, so the
   * row itself stays a single line.
   */
  private rowTitle(dashboard: DashboardModel): string {
    const description = (dashboard.description || '').trim()
    return description ? `${dashboard.name}\n${description}` : dashboard.name
  }

  private handleNodeClick(data: DashboardModel) {
    if (this.selectedId === data.id) return
    this.selectDashboard(data)
  }

  private allowDrop(draggingNode: any, dropNode: any, type: 'prev' | 'inner' | 'next') {
    return type !== 'inner'
  }

  /**
   * Element starts a row drag from the node content. A press that began on the
   * ⋯ button must only open the menu, so it is excluded here.
   */
  private allowDrag() {
    return !this.operPointerActive
  }

  private handleDrop(draggingNode: any, dropNode: any, position: 'before' | 'after' | 'inner') {
    if (!draggingNode || !dropNode) return
    if (position === 'inner') return
    const sourceId = draggingNode.data.id
    const targetId = dropNode.data.id
    if (!sourceId || !targetId || sourceId === targetId) return
    const list = [...this.dashboards]
    const from = list.findIndex((d) => d.id === sourceId)
    const to = list.findIndex((d) => d.id === targetId)
    if (from === -1 || to === -1) return
    const [moved] = list.splice(from, 1)
    let insertIndex = to
    if (position === 'after') insertIndex = to + (from < to ? 0 : 1)
    if (position === 'before') insertIndex = to + (from < to ? -1 : 0)
    insertIndex = Math.max(0, Math.min(insertIndex, list.length))
    list.splice(insertIndex, 0, moved)
    this.$emit(
      'reordered',
      list.map((d) => d.id),
    )
  }

  @Watch('selectedId', { immediate: true })
  private onSelectedIdChanged(val: string | null) {
    this.$nextTick(() => {
      const tree: any = this.$refs.tree
      if (tree && val) {
        tree.setCurrentKey(val)
      }
    })
  }

  @Watch('dashboards')
  private onDashboardsChanged() {
    this.$nextTick(() => {
      const tree: any = this.$refs.tree
      if (tree && this.selectedId) {
        tree.setCurrentKey(this.selectedId)
      }
    })
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

.dashboard-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  .dashboard-topbar {
    @include flex-space-between;
    height: 48px;
    flex-shrink: 0;
    padding-left: 16px;
    border-bottom: 1px solid var(--color-border-default);
    -webkit-app-region: drag;

    a {
      -webkit-app-region: no-drag;
    }

    // Second-level navigation inside the Viewer tabs, not a page title.
    .dashboard-titlebar {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-title);
    }

    .dashboard-tailbar {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-right: 12px;
    }

    .new-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      color: var(--color-text-light);
      transition: color 0.15s ease, background-color 0.15s ease;

      .icon-create-new,
      .icon-hide-connections {
        font-size: 16px;
        color: inherit;
      }

      &:hover {
        color: var(--color-main-green);
      }
    }
  }

  .dashboards-list {
    flex: 1;
    overflow-y: hidden;

    &:hover {
      overflow-y: overlay;
    }

    .el-tree {
      height: 100%;
      // Same 8px around the rows as their side margin, so the selected row
      // does not touch the header divider.
      padding: 8px 0;
      box-sizing: border-box;
      background-color: var(--color-bg-normal);
      .el-tree-node__content {
        margin: 0 8px;
        height: 40px;
        border-radius: 8px;
      }
      // Dashboards are not nested, so the slot Element keeps for the expand arrow would only indent the rows
      .el-tree-node__expand-icon.is-leaf {
        display: none;
      }

      // Hover only on the rows that are not already selected.
      .el-tree-node:not(.is-current) > .el-tree-node__content:hover {
        background-color: var(--color-bg-item);
      }

      .is-current > .el-tree-node__content {
        background-color: var(--color-bg-item);

        .dashboard-name {
          color: var(--color-text-title);
        }
      }

      // Element draws the drag feedback with this element (blue by default).
      .el-tree__drop-indicator {
        background-color: var(--color-main-green);
      }
    }

    .custom-tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 0;
    }

    .dashboard-item {
      height: 100%;
      width: 100%;
      cursor: pointer;
      position: relative;
      transition: background 0.3s ease;
      user-select: none;
      border-radius: 8px;
      // 8px row margin + 8px padding = the 16px text inset used by the Agent list.
      padding: 0 8px;
      display: flex;
      align-items: center;
      min-width: 0;

      .dashboard-name {
        flex: 1;
        min-width: 0;
        // The ⋯ button's slot is always reserved, so the ellipsis never moves
        // when the button appears on hover.
        padding-right: 28px;
        font-size: 13px;
        font-weight: 400;
        color: var(--color-text-default);
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      // Row action, revealed on hover like the Agent conversation list.
      .dashboard-oper {
        position: absolute;
        top: 50%;
        right: 4px;
        transform: translateY(-50%);
        display: inline-flex;
      }

      .dashboard-oper-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: transparent;
        color: var(--color-text-light);
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease, color 0.15s ease;

        &:hover {
          color: var(--color-text-title);
        }
      }

      &:hover .dashboard-oper-trigger,
      &:focus-within .dashboard-oper-trigger {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }
}

@include el-dropdown-menu-common;
</style>
