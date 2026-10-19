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
      <template v-if="!isLoadingData">
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
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <div class="dashboard-item" :title="rowTitle(data)" @contextmenu.prevent="openContextMenu(data, $event)">
                <div class="dashboard-icon">
                  <i class="el-icon-s-grid"></i>
                </div>
                <span class="dashboard-name">{{ data.name }}</span>
              </div>
            </span>
          </template>
        </el-tree>
      </template>
      <template v-else>
        <el-skeleton class="dashboards-list-skeleton" :row="8" animated />
      </template>
      <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
        <a href="javascript:;" class="context-menu__item" @click="handleEdit">
          <i class="iconfont icon-edit"></i>{{ $t('common.edit') }}
        </a>
        <a href="javascript:;" class="context-menu__item danger" @click="handleDelete">
          <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
        </a>
      </contextmenu>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import Contextmenu from '@/components/Contextmenu.vue'
import '@/assets/font/iconfont'

@Component({
  components: { Contextmenu },
})
export default class DashboardsList extends Vue {
  private isLoadingData = false
  @Prop({ type: Array, default: () => [] }) readonly dashboards!: DashboardModel[]
  @Prop({ type: String, default: null }) readonly selectedId!: string | null

  // context menu state
  private showContextmenu = false
  private selectedDashboardForMenu: DashboardModel | null = null
  private contextmenuConfig: ContextmenuModel = { top: 0, left: 0 }

  private selectDashboard(dashboard: DashboardModel) {
    this.$emit('dashboard-selected', dashboard)
  }

  private createDashboard() {
    this.$emit('create-dashboard')
  }

  /**
   * Native tooltip for a row: the description is only shown on hover, so the
   * row itself stays a single line.
   */
  private rowTitle(dashboard: DashboardModel): string {
    const description = (dashboard.description || '').trim()
    return description ? `${dashboard.name}\n${description}` : dashboard.name
  }

  public upsertDashboard(dashboard: DashboardModel, selectAfter = false) {
    if (!dashboard || !dashboard.id) return
    this.$emit('upsert', { dashboard, selectAfter })
  }

  private handleNodeClick(data: DashboardModel) {
    if (this.selectedId === data.id) return
    this.selectDashboard(data)
  }

  private allowDrop(draggingNode: any, dropNode: any, type: 'prev' | 'inner' | 'next') {
    return type !== 'inner'
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

  private openContextMenu(row: DashboardModel, event: MouseEvent) {
    if (this.selectedId !== row.id) {
      this.handleNodeClick(row)
    }
    if (!this.showContextmenu) {
      const { clientX, clientY } = event
      this.contextmenuConfig.top = clientY
      this.contextmenuConfig.left = clientX
      this.showContextmenu = true
      this.selectedDashboardForMenu = row
    } else {
      this.showContextmenu = false
    }
  }

  private handleEdit() {
    if (!this.selectedDashboardForMenu) return
    this.$emit('edit-dashboard', this.selectedDashboardForMenu)
    this.showContextmenu = false
  }

  private handleDelete() {
    if (!this.selectedDashboardForMenu) return
    this.$emit('delete-dashboard', this.selectedDashboardForMenu)
    this.showContextmenu = false
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
    // Same line as the right header's bottom border.
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

    .dashboards-list-skeleton {
      margin: 0 16px;
    }

    .el-tree {
      height: 100%;
      background-color: var(--color-bg-normal);
      .el-tree-node__content {
        margin: 0 8px;
        height: 36px;
        border-radius: 6px;
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

        .dashboard-icon i {
          color: var(--color-main-green);
        }

        .dashboard-name {
          font-weight: 500;
          color: var(--color-text-title);
        }
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
      border-radius: 6px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      min-width: 0;

      &.drag-before::before,
      &.drag-after::after {
        content: '';
        position: absolute;
        left: 8px;
        right: 8px;
        height: 0;
        border-top: 2px dashed var(--color-border-default);
      }

      &.drag-before::before {
        top: -1px;
      }

      &.drag-after::after {
        bottom: -1px;
      }

      .dashboard-name {
        flex: 1;
        min-width: 0;
        font-size: 13px;
        font-weight: 400;
        color: var(--color-text-title);
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .dashboard-icon {
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-right: 8px;

        i {
          font-size: 14px;
          color: var(--color-text-light);
        }
      }
    }
  }
}
</style>
