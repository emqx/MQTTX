<template>
  <div class="dashboard-canvas-root">
    <div class="dashboard-canvas-grid">
      <grid-layout
        :layout="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="true"
        :is-resizable="true"
        :is-responsive="false"
        :vertical-compact="true"
        :use-css-transforms="true"
        @layout-updated="onLayoutUpdated"
      >
        <grid-item
          v-for="widget in widgets"
          :key="widget.id"
          :x="widget.x"
          :y="widget.y"
          :w="widget.w"
          :h="widget.h"
          :i="String(widget.id)"
          :static="widget.static"
          class="grid-item-tem"
          @resized="onItemResized"
          @resize="onItemResizing"
        >
          <div class="widget-card">
            <div class="widget-header">
              <div class="widget-title" :title="widget.title || ''">{{ widget.title || '' }}</div>
              <el-dropdown @command="onWidgetMenuCommand($event, widget)" popper-class="dashboard-widget-dropdown">
                <span class="widget-menu-trigger" title="Options">
                  <i class="el-icon-more"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">
                    <i class="iconfont icon-edit"></i>
                    Edit
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" class="is-danger">
                    <i class="iconfont icon-delete"></i>
                    Delete
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div class="widget-body">
              <WidgetRenderer :widget="widget" :value="widgetValues[String(widget.id)]" @error="onWidgetError" />
            </div>
          </div>
        </grid-item>
      </grid-layout>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import '@/assets/font/iconfont'
import { GridLayout, GridItem } from 'vue-grid-layout'
import WidgetRenderer from '@/widgets/WidgetRenderer.vue'
import { WidgetModel } from '@/types/widgets'
import { globalEventBus } from '@/utils/globalEventBus'

@Component({
  components: {
    GridLayout,
    GridItem,
    WidgetRenderer,
  },
})
export default class DashboardCanvas extends Vue {
  @Prop({ type: String, required: false, default: null }) readonly dashboardId!: string | null
  @Prop({ type: Array, default: () => [] }) readonly widgets!: WidgetModel[]

  private widgetValues: Record<string, number> = {}
  private widgetValueUnsubscriber: ((...args: any[]) => void) | null = null

  get layout() {
    return this.widgets.map((widget) => ({
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      i: String(widget.id),
      static: widget.static,
      minW: widget.minW,
      minH: widget.minH,
      maxW: widget.maxW,
      maxH: widget.maxH,
    }))
  }

  mounted() {}

  private debouncedLayoutChange = this.debounce(this.emitLayoutChanged, 300)

  private onLayoutUpdated(layout: any[]) {
    this.emitLayoutChanged(layout)
  }

  private emitLayoutChanged(layout: any[]) {
    this.$emit('layout-changed', layout)
  }

  private debounce(func: Function, wait: number) {
    let timeout: number | null = null
    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout)
      timeout = window.setTimeout(() => func(...args), wait)
    }
  }

  private onWidgetError(error: Error, widget: WidgetModel) {
    console.error(`Widget ${widget.id} error:`, error)
    this.$emit('widget-error', { error, widget })
  }

  private handleWidgetCommand(cmd: string, widget: WidgetModel) {
    if (cmd === 'edit') {
      this.$emit('edit-widget', widget)
    } else if (cmd === 'delete') {
      if (widget.id) this.$emit('remove-widget', String(widget.id))
    }
  }

  private onWidgetMenuCommand(cmd: string, widget: WidgetModel) {
    this.handleWidgetCommand(cmd, widget)
  }

  // Some versions of vue-grid-layout do not fire layout-updated on resize.
  // Handle explicit resize events from each item and emit a synthesized layout.
  private onItemResized(...args: any[]) {
    // Common signatures:
    // (i, newH, newW, newHPx, newWPx) or (i, newH, newW, x, y)
    const i = String(args[0])
    const newH = Number(args[1])
    const newW = Number(args[2])
    const nextLayout = this.widgets.map((w) => ({
      x: w.x,
      y: w.y,
      w: String(w.id) === i ? newW : w.w,
      h: String(w.id) === i ? newH : w.h,
      i: String(w.id),
      static: w.static,
      minW: w.minW,
      minH: w.minH,
      maxW: w.maxW,
      maxH: w.maxH,
    }))
    this.$emit('layout-changed', nextLayout)
  }

  private onItemResizing(...args: any[]) {
    this.onItemResized(...args)
  }

  removeItem(itemId: string) {
    this.$emit('remove-widget', itemId)
  }

  beforeDestroy() {
    if (this.widgetValueUnsubscriber) {
      this.widgetValueUnsubscriber()
      this.widgetValueUnsubscriber = null
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/variable.scss';
@import '@/assets/scss/mixins.scss';

.dashboard-canvas-root {
  width: 100%;
  min-height: 100%;
  background: var(--color-bg-primary);
  padding: 0;
}

.dashboard-canvas-grid {
  width: 100%;
  margin-top: 10px;
  height: 100%;
  min-height: 400px;

  .vue-grid-layout {
    background: var(--color-bg-primary);
    border-radius: 4px;
    min-height: 400px;
    transition: background 0.2s;
  }

  .vue-grid-item:not(.vue-grid-placeholder) {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    box-shadow: 0 1px 4px 0 var(--color-shadow-leftlist);
    transition: background 0.2s, border 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    overflow: hidden;
    padding: 0;

    &:hover {
      border-color: var(--color-main-green);
      background: var(--color-bg-hover);
    }

    .vue-resizable-handle {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .vue-resizable-handle {
      opacity: 1;
    }
  }

  .dashboard-canvas-grid-text {
    font-size: 24px;
    color: var(--color-text-title);
    text-align: center;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  ::v-deep .vue-grid-item.vue-grid-placeholder {
    background: var(--color-main-green) !important;
  }
}

.widget-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
}

.widget-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100% - 28px);
}

.widget-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-text-tips);
  cursor: pointer;
}

.widget-body {
  flex: 1;
  min-height: 0;
  padding: 8px;
}
</style>

<style lang="scss">
.dashboard-widget-dropdown {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  box-shadow: 0 4px 12px 0 var(--color-shadow-leftlist);
  padding: 0;
  border-radius: 4px;

  .el-dropdown-menu {
    background: var(--color-bg-card);
    border: none;
    padding: 8px 0;
  }

  .el-dropdown-menu__item {
    color: var(--color-text-title);
    line-height: 32px;
    height: 32px;
    padding: 4px 12px;
    display: flex;
    align-items: center;

    .iconfont {
      font-size: 18px;
      margin-right: 5px;
    }

    &.is-disabled {
      cursor: not-allowed;
      color: var(--color-text-light);
      &:hover {
        color: var(--color-text-light);
      }
    }

    &.is-danger {
      color: var(--color-minor-red);
    }

    &:hover,
    &:focus {
      color: var(--color-main-green);
      background: var(--color-light-green);
    }

    &.is-danger:hover,
    &.is-danger:focus {
      color: var(--color-minor-red);
      background: var(--color-light-red);
    }
  }

  .el-dropdown-menu__item--divided {
    position: relative;
    &::before {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      top: -4px;
      height: 1px;
      background: var(--color-border-default);
    }
  }
}
</style>
