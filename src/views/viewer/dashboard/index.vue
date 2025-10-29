<template>
  <div class="dashboards">
    <transition name="slide">
      <div v-show="showDashboardsList" class="dashboards-left-panel">
        <dashboards-list
          ref="dashboardsList"
          :dashboards="dashboards"
          :selected-id="selectedDashboardId"
          @toggle-list="showDashboardsList = $event"
          @dashboard-selected="onDashboardSelected"
          @create-dashboard="toCreateDashboard"
          @reordered="onDashboardsReordered"
          @edit-dashboard="onEditDashboardFromList"
          @delete-dashboard="onDeleteDashboardFromList"
        />
      </div>
    </transition>

    <DashboardHeader
      ref="header"
      :show-dashboards-list="showDashboardsList"
      :selected-dashboard-id="selectedDashboardId"
      :dashboards="dashboards"
      :selected-dashboard="selectedDashboard"
      :time-range-model="timeRangeModel"
      :time-range-type="timeRangeType"
      :duration="duration"
      :is-adding-widget="isAddingWidget"
      @toggle-list="showDashboardsList = $event"
      @dashboard-selected="onDashboardSelected"
      @add-visualization="toAddVisualization"
      @time-range-select="onTimeRangeSelect"
      @create-dashboard="saveDashboard"
      @save-dashboard="saveDashboard"
      @cancel-add="cancelAdd"
    />

    <DashboardContent
      :loading-state="loadingState"
      :show-dashboards-list="showDashboardsList"
      :selected-dashboard-id="selectedDashboardId"
      :dashboard-widgets="dashboardWidgets"
      :time-range="timeRange"
      :time-range-type="timeRangeType"
      :duration="duration"
      :is-empty="isEmpty"
      :is-adding-widget="isAddingWidget"
      :editing-widget="editingWidget"
      :selected-dashboard-has-widgets="selectedDashboardHasWidgets"
      @create-dashboard="toCreateDashboard"
      @add-visualization="toAddVisualization"
      @layout-changed="onLayoutChanged"
      @edit-widget="onEditWidget"
      @remove-widget="onRemoveWidget"
      @refresh-widgets="loadCurrentDashboardWidgets"
      @create-widget="createWidget"
      @cancel-add="cancelAdd"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DashboardsList from './DashboardsList.vue'
import DashboardHeader from './DashboardHeader.vue'
import DashboardContent from './DashboardContent.vue'
import useServices from '@/database/useServices'
import time from '@/utils/time'

@Component({
  components: {
    DashboardsList,
    DashboardHeader,
    DashboardContent,
  },
})
export default class Dashboards extends Vue {
  private showDashboardsList: boolean = true
  private isAddingWidget: boolean = false
  private editingWidget: WidgetModel | null = null

  // === CONSOLIDATED LOADING STATE ===
  private loadingState = {
    dashboards: false,
    widgets: false,
    initializing: false,
  }

  private dashboards: DashboardModel[] = []
  private selectedDashboard: DashboardModel | null = null
  private selectedDashboardId: string | null = null
  private dashboardWidgets: WidgetModel[] = []

  private isSelectingDashboard: boolean = false
  private timeRange: [string, string] = [time.getDateBefore(24 * 60), time.getNowDate()]
  private timeRangeType: 'live' | 'static' = 'static'
  private duration: number = 24 * 60

  get isEmpty(): boolean {
    return this.dashboards.length === 0
  }

  get selectedDashboardHasWidgets(): boolean {
    return this.dashboardWidgets.length > 0
  }

  get timeRangeModel(): [string, string] {
    if (!this.timeRange || this.timeRange.length !== 2 || !this.timeRange[0] || !this.timeRange[1]) {
      return [time.getDateBefore(24 * 60), time.getNowDate()]
    }
    return this.timeRange
  }

  set timeRangeModel(val: [string, string] | null) {
    this.timeRange =
      val && val.length === 2 && val[0] && val[1]
        ? (val as [string, string])
        : [time.getDateBefore(24 * 60), time.getNowDate()]
  }

  async mounted() {
    await this.initializeComponent()
  }

  private async initializeComponent(): Promise<void> {
    this.loadingState.initializing = true
    try {
      await this.loadDashboards()
      await this.setInitialDashboardSelection()
      await this.loadCurrentDashboardWidgets()
    } finally {
      this.loadingState.initializing = false
    }
  }

  private handleError(error: Error, context: string, showUser: boolean = true): void {
    console.error(`[DASHBOARDS-${context}] Error:`, error)
    this.$log?.error?.(error.toString())
    if (showUser) {
      this.$message.error(`${context} failed: ${error.message}`)
    }
  }

  private async loadDashboards(): Promise<void> {
    this.loadingState.dashboards = true
    try {
      const { dashboardService } = useServices()
      this.dashboards = await dashboardService.getAll()
    } catch (error) {
      this.handleError(error as Error, 'Loading dashboards')
      this.dashboards = []
    } finally {
      this.loadingState.dashboards = false
    }
  }

  private async setInitialDashboardSelection(): Promise<void> {
    if (this.isEmpty) {
      this.clearDashboardSelection()
      return
    }

    const persistedId = this.getPersistedDashboardId()
    const dashboard = persistedId ? this.dashboards.find((d) => d.id === persistedId) : this.dashboards[0]

    if (dashboard) {
      this.setSelectedDashboard(dashboard, false) // Don't persist on initial load
    }
  }

  private async loadCurrentDashboardWidgets(): Promise<void> {
    if (!this.selectedDashboardId) {
      this.dashboardWidgets = []
      return
    }

    this.loadingState.widgets = true
    try {
      const { widgetService } = useServices()
      this.dashboardWidgets = await widgetService.getAll(this.selectedDashboardId)
    } catch (error) {
      this.handleError(error as Error, 'Loading dashboard widgets')
      this.dashboardWidgets = []
    } finally {
      this.loadingState.widgets = false
    }
  }

  private async refreshData(scope: 'dashboards' | 'widgets' | 'all' = 'all'): Promise<void> {
    const promises: Promise<void>[] = []

    if (scope === 'dashboards' || scope === 'all') {
      promises.push(this.loadDashboards())
    }

    if (scope === 'widgets' || scope === 'all') {
      promises.push(this.loadCurrentDashboardWidgets())
    }

    await Promise.all(promises)

    // Update selected dashboard reference if dashboards were refreshed
    if (scope === 'dashboards' || scope === 'all') {
      if (this.selectedDashboardId) {
        const found = this.dashboards.find((d) => d.id === this.selectedDashboardId)
        if (found) {
          this.selectedDashboard = found
        } else {
          this.clearDashboardSelection()
        }
      }
    }
  }

  private setSelectedDashboard(dashboard: DashboardModel, persist: boolean = true): void {
    this.selectedDashboard = dashboard
    this.selectedDashboardId = dashboard.id || null

    // Load time range settings from dashboard global settings
    this.loadTimeRangeSettings()

    if (persist && dashboard.id) {
      this.persistDashboardId(dashboard.id)
    }
  }

  private clearDashboardSelection(): void {
    this.selectedDashboard = null
    this.selectedDashboardId = null
    this.dashboardWidgets = []
    this.clearPersistedDashboardId()
  }

  private async selectDashboard(
    dashboard: DashboardModel | string,
    options: { persist?: boolean; skipConfirmation?: boolean } = {},
  ): Promise<void> {
    if (this.isSelectingDashboard) return
    this.isSelectingDashboard = true

    try {
      // Handle string ID by finding the dashboard
      const targetDashboard =
        typeof dashboard === 'string' ? this.dashboards.find((d) => d.id === dashboard) : dashboard

      if (!targetDashboard) {
        this.handleError(new Error('Dashboard not found'), 'Dashboard selection', false)
        return
      }

      this.setSelectedDashboard(targetDashboard, options.persist)
      await this.loadCurrentDashboardWidgets()
    } finally {
      this.isSelectingDashboard = false
    }
  }

  private async selectDashboardById(id: string): Promise<void> {
    await this.selectDashboard(id)
  }

  private getPersistedDashboardId(): string | null {
    try {
      return window.localStorage.getItem('mqttx_last_dashboard_id')
    } catch (e) {
      return null
    }
  }

  private persistDashboardId(id: string): void {
    try {
      window.localStorage.setItem('mqttx_last_dashboard_id', id)
    } catch (e) {
      this.$log?.error?.((e as Error).toString())
    }
  }

  private clearPersistedDashboardId(): void {
    try {
      window.localStorage.removeItem('mqttx_last_dashboard_id')
    } catch (e) {
      this.$log?.error?.((e as Error).toString())
    }
  }

  private async onDashboardSelected(dashboard: DashboardModel): Promise<void> {
    await this.selectDashboard(dashboard)
  }

  private async onDashboardsReordered(newOrderIds: string[]): Promise<void> {
    const idToDashboard = new Map(this.dashboards.map((d) => [d.id, d]))
    this.dashboards = newOrderIds.map((id) => idToDashboard.get(id)).filter(Boolean) as DashboardModel[]

    try {
      const { dashboardService } = useServices()
      const orderUpdates = newOrderIds
        .map((id, index) => (id ? { id, orderId: index + 1 } : null))
        .filter((update): update is { id: string; orderId: number } => update !== null)

      const success = await dashboardService.updateOrders(orderUpdates)
      if (!success) {
        this.$message.error(String(this.$t('viewer.failedToSaveDashboardOrder')))
        await this.refreshData('dashboards')
      }
    } catch (error) {
      console.error('Error updating dashboard order:', error)
      this.$message.error(String(this.$t('viewer.failedToSaveDashboardOrder')))
      await this.refreshData('dashboards')
    }
  }

  private onEditDashboardFromList(dashboard: DashboardModel): void {
    this.setSelectedDashboard(dashboard)
  }

  private async onDeleteDashboardFromList(dashboard: DashboardModel): Promise<void> {
    if (!dashboard?.id) return

    try {
      await this.$confirm(String(this.$t('common.confirmDelete')), String(this.$t('common.confirm')), {
        type: 'warning',
      })
    } catch (e) {
      return
    }

    await this.deleteDashboard(dashboard.id)
  }

  private async saveDashboard(dashboardData: Partial<DashboardModel>): Promise<void> {
    const { dashboardService } = useServices()
    const payload: Partial<DashboardModel> = {
      name: (dashboardData.name || '').trim(),
      description: (dashboardData.description || '').trim(),
    }

    if (!payload.name) {
      this.$message.warning(String(this.$t('common.inputRequired')))
      return
    }

    let result: DashboardModel | null | undefined = null
    if (dashboardData.id) {
      result = await dashboardService.update(dashboardData.id, payload)
    } else {
      result = await dashboardService.create(payload as DashboardModel)
    }

    if (result?.id) {
      this.$message.success(String(this.$t('common.saveSuccess') || 'Saved'))
      await this.refreshData('dashboards')
      await this.selectDashboard(result)
      this.notifyDashboardsList('upsert', result, true)
    } else {
      this.$message.error(String(this.$t('common.savefailed') || 'Save failed'))
    }
  }

  private async deleteDashboard(id: string): Promise<void> {
    const { dashboardService } = useServices()
    const deleted = await dashboardService.delete(id)

    if (deleted) {
      this.$message.success(String(this.$t('common.deleteSuccess') || 'Deleted'))
      await this.refreshData('dashboards')

      if (this.isEmpty) {
        this.clearDashboardSelection()
      } else if (this.selectedDashboardId === id) {
        await this.selectDashboard(this.dashboards[0])
      }
    } else {
      this.$message.error(String(this.$t('common.deletefailed') || 'Delete failed'))
    }
  }

  private notifyDashboardsList(action: string, dashboard: DashboardModel, selectAfter: boolean = false): void {
    const listRef = this.$refs.dashboardsList as InstanceType<typeof DashboardsList>
    if (listRef?.upsertDashboard) {
      listRef.upsertDashboard(dashboard, selectAfter)
    }
  }

  private async createWidget(widgetData: Partial<WidgetModel>): Promise<void> {
    if (!this.selectedDashboardId) {
      this.$message.error(String(this.$t('viewer.noDashboardSelected')))
      return
    }

    try {
      if (!widgetData.type) {
        throw new Error(String(this.$t('viewer.widgetTypeRequired')))
      }

      if (!widgetData.connectionId) {
        throw new Error(String(this.$t('viewer.connectionRequired')))
      }

      if (!widgetData.topicPattern) {
        throw new Error(String(this.$t('viewer.topicPatternRequired')))
      }

      const { widgetService } = useServices()

      const existingWidgets = await widgetService.getAll(this.selectedDashboardId)
      const maxY = Math.max(0, ...existingWidgets.map((w) => w.y + w.h))

      const payload: WidgetModel = {
        type: widgetData.type,
        title: widgetData.title || `${widgetData.type} Widget`,
        dashboardId: this.selectedDashboardId,
        x: widgetData.x ?? 0,
        y: widgetData.y ?? maxY,
        w: widgetData.w ?? 4,
        h: widgetData.h ?? 6,
        static: widgetData.static ?? false,
        connectionId: widgetData.connectionId,
        topicPattern: widgetData.topicPattern,
        valueField: widgetData.valueField,
        fallbackValue: widgetData.fallbackValue ?? 0,
        schemaType: widgetData.schemaType,
        schemaId: widgetData.schemaId,
        schemaMessageName: widgetData.schemaMessageName,
        widgetOptions: widgetData.widgetOptions ?? {},
      }

      const created = await widgetService.create(payload)

      if (created?.id) {
        this.$message.success(String(this.$t('common.saveSuccess') || 'Widget saved successfully'))
        await this.loadCurrentDashboardWidgets()
      } else {
        throw new Error('Widget creation returned no ID')
      }
    } catch (error) {
      this.$message.error(`Failed to create widget: ${(error as Error).message}`)
    }
  }

  private layoutSaveTimer: number | null = null
  private pendingLayoutUpdates: Array<{ id: string; x: number; y: number; w: number; h: number }> = []

  private onLayoutChanged(layout: Array<{ i: string; x: number; y: number; w: number; h: number }>): void {
    if (!Array.isArray(layout) || layout.length === 0) return

    const idToWidget = new Map(this.dashboardWidgets.map((w) => [String(w.id), w]))

    const changed: Array<{ id: string; x: number; y: number; w: number; h: number }> = []
    layout.forEach((item) => {
      const widget = idToWidget.get(item.i)
      if (!widget) return
      const hasChanged = widget.x !== item.x || widget.y !== item.y || widget.w !== item.w || widget.h !== item.h
      if (hasChanged) {
        // Instead of multiple $set calls, update the widget object once
        const widgetIndex = this.dashboardWidgets.findIndex((w) => w.id === widget.id)
        if (widgetIndex !== -1) {
          const updatedWidget = { ...widget, x: item.x, y: item.y, w: item.w, h: item.h }
          this.$set(this.dashboardWidgets, widgetIndex, updatedWidget)
        }
        if (widget.id) {
          changed.push({ id: widget.id, x: item.x, y: item.y, w: item.w, h: item.h })
        }
      }
    })

    if (changed.length === 0) return

    const nextMap = new Map<string, { id: string; x: number; y: number; w: number; h: number }>()
    this.pendingLayoutUpdates.forEach((u) => nextMap.set(u.id, u))
    changed.forEach((u) => nextMap.set(u.id, u))
    this.pendingLayoutUpdates = Array.from(nextMap.values())

    this.schedulePersistLayout()
  }

  private schedulePersistLayout(delayMs: number = 500): void {
    if (this.layoutSaveTimer) {
      window.clearTimeout(this.layoutSaveTimer)
      this.layoutSaveTimer = null
    }
    this.layoutSaveTimer = window.setTimeout(() => {
      this.persistLayoutUpdates().catch((err) => {
        this.$log?.error?.((err as Error).toString())
      })
    }, delayMs)
  }

  private async persistLayoutUpdates(): Promise<void> {
    const updates = this.pendingLayoutUpdates
    this.pendingLayoutUpdates = []
    if (!updates.length) return

    try {
      const { widgetService } = useServices()
      await widgetService.updateMany(updates)
    } catch (e) {
      await this.loadCurrentDashboardWidgets()
    }
  }

  private onEditWidget(widget: WidgetModel): void {
    this.editingWidget = { ...widget }
    this.isAddingWidget = true
  }

  private async onRemoveWidget(id: string): Promise<void> {
    try {
      await this.$confirm(String(this.$t('common.confirmDelete')), String(this.$t('common.confirm')), {
        type: 'warning',
      })
    } catch (e) {
      return
    }
    const { widgetService } = useServices()
    await widgetService.delete(id)
    this.$message.success(String(this.$t('common.deleteSuccess') || 'Deleted'))
    this.dashboardWidgets = this.dashboardWidgets.filter((w) => w.id !== id)
  }

  beforeDestroy() {
    if (this.layoutSaveTimer) {
      window.clearTimeout(this.layoutSaveTimer)
      this.layoutSaveTimer = null
    }
    this.pendingLayoutUpdates = []
  }

  private onTimeRangeSelect(options: { timeRange: [string, string] | null; duration: number; isLive: boolean }): void {
    // Update the time range
    this.timeRange = options.timeRange || [time.getDateBefore(24 * 60), time.getNowDate()]

    // Convert duration from milliseconds to minutes for consistency with DashboardView
    // Handle edge case where duration might be 0 or undefined
    const durationInMinutes =
      options.duration && options.duration > 0 ? Math.round(options.duration / (60 * 1000)) : 24 * 60 // Default to 24 hours if duration is invalid
    this.duration = durationInMinutes

    if (options.isLive) {
      // Store live mode settings in dashboard global settings
      this.timeRangeType = 'live'
      this.saveTimeRangeSettings({
        timeRange: this.timeRange,
        isLive: true,
        duration: durationInMinutes, // Store in minutes
        type: 'live',
      })
    } else {
      // Handle static ranges
      this.timeRangeType = 'static'
      this.saveTimeRangeSettings({
        timeRange: this.timeRange,
        isLive: false,
        type: 'static',
      })
    }
  }

  private loadTimeRangeSettings(): void {
    const settings = this.selectedDashboard?.globalSettings?.timeRange

    if (settings) {
      // Use saved settings if they exist
      this.timeRangeType = settings.type || 'static'
      this.duration = settings.duration || 24 * 60

      if (settings.type === 'live') {
        // For live mode, set time range to current time window
        const now = new Date()
        const start = new Date(now.getTime() - this.duration * 60 * 1000)
        this.timeRange = [time.toFormat(start), time.toFormat(now)]
      } else {
        // For static mode, use saved time range
        this.timeRange = settings.timeRange || [time.getDateBefore(24 * 60), time.getNowDate()]
      }
    } else {
      // Only set defaults if no settings exist
      this.timeRange = [time.getDateBefore(24 * 60), time.getNowDate()]
      this.timeRangeType = 'static'
      this.duration = 24 * 60
    }
  }

  private async saveTimeRangeSettings(settings: {
    timeRange: [string, string]
    isLive: boolean
    duration?: number
    type: 'live' | 'static'
  }): Promise<void> {
    if (!this.selectedDashboard?.id) return

    try {
      const { dashboardService } = useServices()
      const globalSettings = {
        ...this.selectedDashboard.globalSettings,
        timeRange: settings,
      }

      await dashboardService.update(this.selectedDashboard.id, {
        globalSettings,
      })

      this.selectedDashboard.globalSettings = globalSettings
    } catch (error) {
      console.error('Failed to save time range settings:', error)
      this.$message.error(String(this.$t('viewer.failedToSaveTimeRangeSettings')))
    }
  }

  private toAddVisualization() {
    this.isAddingWidget = true
    this.editingWidget = null
  }

  private toCreateDashboard() {
    ;(this.$refs.header as any).toCreateDashboard()
  }

  private cancelAdd() {
    this.isAddingWidget = false
    this.editingWidget = null
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

.dashboards {
  position: relative;
  height: calc(100vh - 100px);
  overflow: hidden;
  margin: -14px 0 0 -14px;
  .dashboards-left-panel {
    position: absolute;
    width: 230px;
    height: 100%;
    left: 0;
    top: 0;
    bottom: 0;
    overflow-x: hidden;
    z-index: 1000;
    border-right: 1px solid var(--color-border-default);
    background-color: var(--color-bg-primary);
    transition: all 0.3s ease-in-out;
  }

  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.3s ease;
  }
  .slide-enter {
    transform: translateX(-100%);
  }
  .slide-leave-to {
    transform: translateX(-100%);
  }

  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.25s ease;
  }
  .slide-down-enter,
  .slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
  }
}
</style>
