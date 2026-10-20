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
            <div
              class="dashboard-item"
              :class="{ 'menu-open': menuVisible && menuTargetId === data.id }"
              :title="rowTitle(data)"
              @contextmenu.prevent="openMenuAt(data, $event)"
            >
              <span class="dashboard-name">{{ data.name }}</span>
              <span
                class="dashboard-oper-trigger"
                @click.stop="openMenuFromButton(data, $event)"
                @mousedown.stop="onOperPointerDown"
              >
                <i class="iconfont icon-more"></i>
              </span>
            </div>
          </span>
        </template>
      </el-tree>
      <contextmenu :visible.sync="menuVisible" v-bind="menuConfig">
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
import getContextmenuPosition from '@/utils/getContextmenuPosition'
import '@/assets/font/iconfont'

// Estimated menu size: used for the right-click entry (`getContextmenuPosition`)
// and as the first-frame estimate for the ⋯ entry, which then re-aligns to the
// menu's measured width. Two items are about 90px tall.
const MENU_WIDTH = 140
const MENU_HEIGHT = 90

@Component({
  components: { Contextmenu },
})
export default class DashboardsList extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly dashboards!: DashboardModel[]
  @Prop({ type: String, default: null }) readonly selectedId!: string | null

  // === ROW MENU ===
  private menuVisible = false
  private menuConfig: ContextmenuModel = { top: 0, left: 0 }
  // The row the open menu acts on; cleared when the menu closes.
  private menuTargetId: string | null = null

  /**
   * True while a press that started on the ⋯ button is still held, so the tree
   * does not turn that press into a row drag (see `allowDrag`).
   */
  private operPointerActive = false

  @Watch('menuVisible')
  private onMenuVisibleChanged(visible: boolean) {
    if (!visible) {
      this.menuTargetId = null
    }
  }

  private selectDashboard(dashboard: DashboardModel) {
    this.$emit('dashboard-selected', dashboard)
  }

  private createDashboard() {
    this.$emit('create-dashboard')
  }

  /** Right-click on a row: open at the pointer, or close if already open. */
  private openMenuAt(row: DashboardModel, event: MouseEvent): void {
    if (this.menuVisible) {
      this.menuVisible = false
      return
    }

    const { x, y } = getContextmenuPosition(event, MENU_WIDTH, MENU_HEIGHT)
    this.menuConfig.left = x
    this.menuConfig.top = y
    this.menuTargetId = row.id || null
    this.menuVisible = true
  }

  /** ⋯ button: right-aligned with the button, 4px under it (then clamped to the viewport). */
  private openMenuFromButton(row: DashboardModel, event: MouseEvent): void {
    if (this.menuVisible) {
      this.menuVisible = false
      return
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const top = rect.bottom + 4
    const targetId = row.id || null

    // First frame uses the estimate; the menu is content-sized, so its real
    // width is measured as soon as it renders (see below).
    const { x, y } = getContextmenuPosition(
      { clientX: rect.right - MENU_WIDTH, clientY: top } as MouseEvent,
      MENU_WIDTH,
      MENU_HEIGHT,
    )
    this.menuConfig.left = x
    this.menuConfig.top = y
    this.menuTargetId = targetId
    this.menuVisible = true

    // The card is content-sized (its width also changes with the language), so
    // align its measured right edge with the button's right edge.
    this.$nextTick(() => {
      if (!this.menuVisible || this.menuTargetId !== targetId) return

      const menu = this.$el.querySelector('.contextmenu') as HTMLElement | null
      if (!menu) return

      const width = menu.offsetWidth || MENU_WIDTH
      const clamped = getContextmenuPosition(
        { clientX: rect.right - width, clientY: top } as MouseEvent,
        width,
        menu.offsetHeight || MENU_HEIGHT,
      )
      this.menuConfig.left = clamped.x
      this.menuConfig.top = clamped.y
    })
  }

  private get menuTarget(): DashboardModel | null {
    return this.dashboards.find((dashboard) => dashboard.id === this.menuTargetId) || null
  }

  /** Closes the menu first, then emits the row event with the same payload as before. */
  private handleEdit(): void {
    const target = this.menuTarget
    this.menuVisible = false
    if (target) this.$emit('edit-dashboard', target)
  }

  private handleDelete(): void {
    const target = this.menuTarget
    this.menuVisible = false
    if (target) this.$emit('delete-dashboard', target)
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

<style lang="scss" scoped>
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

    // Element renders the tree (and its rows / drop indicator) itself, so the
    // scope attribute stays on .dashboards-list above and everything below the
    // tree root goes through ::v-deep.
    ::v-deep .el-tree {
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
      // Element's row content is `display:flex; align-items:center`, so without
      // this the slot is only as tall as its text and .dashboard-item (height
      // 100%) cannot fill the 40px row (it showed a 19.5px highlight).
      align-self: stretch;
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
      .dashboard-oper-trigger {
        position: absolute;
        top: 50%;
        right: 4px;
        transform: translateY(-50%);
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

      // Same reveal for hover and for the row whose menu is open.
      &:hover .dashboard-oper-trigger,
      &:focus-within .dashboard-oper-trigger,
      &.menu-open .dashboard-oper-trigger {
        opacity: 1;
        pointer-events: auto;
      }

      // Keep the row the menu acts on highlighted while the menu is open.
      &.menu-open {
        background-color: var(--color-bg-item);
      }
    }
  }
}
</style>
