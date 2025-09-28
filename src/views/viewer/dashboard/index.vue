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

    <div class="dashboard-header" :style="{ left: leftValue }" v-if="!isAddingWidget">
      <div class="header-container">
        <div
          v-if="!showDashboardsList"
          class="sidebar-toggle-button"
          @click="showDashboardsList = true"
          :title="$t('viewer.dashboards')"
        >
          <i class="iconfont icon-show-connections"></i>
        </div>
        <div class="header-main-content">
          <transition name="el-zoom-in-top" mode="out-in">
            <div v-if="creatingInTopbar" class="dashboard-create-form" key="create">
              <el-input
                ref="newNameInput"
                size="mini"
                v-model="newDashboard.name"
                :placeholder="$t('connections.name')"
                style="width: 180px; margin-right: 8px"
              />
              <el-input
                size="mini"
                v-model="newDashboard.description"
                :placeholder="$t('viewer.description')"
                style="width: 220px; margin-right: 8px"
              />
              <el-button size="mini" type="primary" @click="handleCreateDashboardTopbar">
                {{ $t('common.save') }}
              </el-button>
              <el-button size="mini" @click="cancelCreateTopbar">
                {{ $t('common.cancel') }}
              </el-button>
            </div>
            <div v-else-if="editingInTopbar" class="dashboard-edit-form" key="edit">
              <el-input
                ref="editNameInput"
                size="mini"
                v-model="editDashboard.name"
                :placeholder="$t('.name')"
                style="width: 180px; margin-right: 8px"
              />
              <el-input
                size="mini"
                v-model="editDashboard.description"
                :placeholder="$t('common.description')"
                style="width: 220px; margin-right: 8px"
              />
              <el-button size="mini" type="primary" @click="handleSaveDashboardEdit">
                {{ $t('common.save') }}
              </el-button>
              <el-button size="mini" @click="cancelEditTopbar">
                {{ $t('common.cancel') }}
              </el-button>
            </div>
            <div v-else class="dashboard-view-section" key="default">
              <el-select
                v-if="!showDashboardsList"
                v-model="selectedDashboardId"
                size="mini"
                :placeholder="$t('viewer.dashboard')"
                @change="onDashboardSelectChange"
                style="width: 180px"
              >
                <el-option
                  v-for="dashboard in dashboards"
                  :key="dashboard.id"
                  :label="dashboard.name"
                  :value="dashboard.id"
                />
              </el-select>
              <a
                v-if="!showDashboardsList && selectedDashboard"
                href="javascript:;"
                class="dashboard-edit-icon"
                style="margin-left: 8px"
                :title="$t('common.edit') || 'Edit'"
                @click="toEditDashboard"
              >
                <i class="el-icon-edit"></i>
              </a>
              <div v-if="!showDashboardsList" class="flex-spacer"></div>
              <el-button
                v-if="!showDashboardsList && selectedDashboard"
                size="mini"
                type="primary"
                icon="el-icon-plus"
                class="add-widget-button"
                @click="toAddVisualization"
              >
                {{ $t('common.new') }}
              </el-button>
              <TimeRangeSelect
                v-if="!showDashboardsList && selectedDashboard"
                v-model="timeRange"
                :time-range-type="timeRangeType"
                :duration="duration"
                size="mini"
                style="margin-left: 8px; width: 200px"
                @range-relative="onTimeRangeSelect"
              />
              <template v-else>
                <div v-if="selectedDashboard" class="topbar-dashboard-view">
                  <div class="dashboard-info-section">
                    <h2 class="dashboard-title">
                      {{ selectedDashboard.name }}
                    </h2>
                    <a
                      href="javascript:;"
                      class="dashboard-edit-icon"
                      style="margin-left: 8px"
                      :title="$t('common.edit') || 'Edit'"
                      @click="toEditDashboard"
                    >
                      <i class="el-icon-edit"></i>
                    </a>
                  </div>
                  <div class="dashboard-actions-section">
                    <el-button
                      size="mini"
                      type="primary"
                      icon="el-icon-plus"
                      class="add-widget-button"
                      @click="toAddVisualization"
                    >
                      {{ $t('common.new') }}
                    </el-button>
                    <TimeRangeSelect
                      v-model="timeRange"
                      size="mini"
                      @range-relative="onTimeRangeSelect"
                      style="margin-left: 8px; width: 200px"
                      :show-live-mode="true"
                    />
                  </div>
                </div>
              </template>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <!-- Dashboard view (Canvas Layout) -->
    <div class="dashboards-view" :class="{ 'full-height': isAddingWidget }" :style="{ marginLeft: detailLeftValue }">
      <template v-if="loadingState.initializing">
        <el-skeleton class="dashboard-skeleton-page" :row="8" animated />
      </template>
      <template v-else>
        <template v-if="isAddingWidget">
          <WidgetConfig :initial-widget="editingWidget" @cancel="cancelAddWidget" @save="handleSaveWidgetConfig" />
        </template>
        <!-- if no dashboard is selected, show the no dashboards placeholder -->
        <template v-else>
          <div v-if="isEmpty" class="no-dashboards-placeholder">
            <h2>{{ $t('viewer.noDashboards') }}</h2>
            <p>
              {{ $t('viewer.createDashboardToGetStarted') }}
            </p>
            <el-button
              type="primary"
              class="primary-btn"
              icon="el-icon-plus"
              style="font-size: 16px; padding: 10px 32px; border-radius: 6px; margin-top: 16px"
              @click="toCreateDashboard"
            >
              {{ $t('viewer.createDashboard') }}
            </el-button>
          </div>
          <!-- if a dashboard is selected, show the dashboard view -->
          <template v-else>
            <template v-if="loadingState.widgets">
              <el-skeleton class="widget-skeleton-page" :row="6" animated />
            </template>
            <!-- if the dashboard has widgets, show the dashboard view -->
            <template v-else-if="selectedDashboardHasWidgets">
              <DashboardView
                :dashboard-id="selectedDashboardId"
                :widgets="dashboardWidgets"
                :time-range="timeRange"
                :time-range-type="timeRangeType"
                :duration="duration"
                @layout-changed="onLayoutChanged"
                @edit-widget="onEditWidget"
                @remove-widget="onRemoveWidget"
              />
            </template>
            <!-- if the dashboard has no widgets, show the no widgets placeholder -->
            <div v-else class="dashboard-placeholder">
              <h2>{{ $t('viewer.noWidgetsTitle') }}</h2>
              <p>
                {{ $t('viewer.noWidgetsHint') }}
              </p>
              <el-button
                type="primary"
                class="primary-btn"
                icon="el-icon-plus"
                style="font-size: 16px; padding: 10px 32px; border-radius: 6px; margin-top: 16px"
                @click="toAddVisualization"
              >
                {{ $t('viewer.addVisualization') }}
              </el-button>
            </div>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import EmptyPage from '@/components/EmptyPage.vue'
import DashboardsList from './DashboardsList.vue'
import DashboardView from './DashboardView.vue'
import WidgetConfig from './WidgetConfig.vue'
import TimeRangeSelect from '@/components/TimeRangeSelect.vue'
import useServices from '@/database/useServices'
import time from '@/utils/time'

@Component({
  components: {
    DashboardsList,
    EmptyPage,
    DashboardView,
    WidgetConfig,
    TimeRangeSelect,
  },
})
export default class Dashboards extends Vue {
  private showDashboardsList: boolean = true
  private isAddingWidget: boolean = false
  private editingWidget: WidgetModel | null = null
  private creatingInTopbar: boolean = false
  private editingInTopbar: boolean = false

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

  private newDashboard: Partial<DashboardModel> = { name: '', description: '' }
  private editDashboard: Partial<DashboardModel> = { name: '', description: '' }

  private isSelectingDashboard: boolean = false
  private timeRange: [string, string] = [time.getDateBefore(24 * 60), time.getNowDate()]
  private timeRangeType: 'live' | 'static' = 'static'
  private duration: number = 24 * 60

  get leftValue(): string {
    return this.showDashboardsList ? '230px' : '0px'
  }

  get detailLeftValue(): string {
    return this.showDashboardsList ? '230px' : '0px'
  }

  get isEmpty(): boolean {
    return this.dashboards.length === 0
  }

  get selectedDashboardHasWidgets(): boolean {
    return this.dashboardWidgets.length > 0
  }

  async mounted() {
    await this.initializeComponent()
  }

  // === INITIALIZATION METHODS ===
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

  // === ERROR HANDLING ===
  private handleError(error: Error, context: string, showUser: boolean = true): void {
    console.error(`[DASHBOARDS-${context}] Error:`, error)
    this.$log?.error?.(error.toString())
    if (showUser) {
      this.$message.error(`${context} failed: ${error.message}`)
    }
  }

  /**
   * Load all dashboards (ordered by orderId)
   */
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

  /**
   * Set the initial dashboard selection based on persistence or default
   */
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

  /**
   * Load widgets for the currently selected dashboard
   */
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

  // === REFRESH METHODS ===
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

  // === DASHBOARD SELECTION METHODS ===
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

      if (this.editingInTopbar && !options.skipConfirmation) {
        await this.handleEditingConfirmation(() => {
          this.setSelectedDashboard(targetDashboard, options.persist)
          this.loadCurrentDashboardWidgets()
        })
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

  private async handleEditingConfirmation(action: () => void): Promise<void> {
    try {
      await this.$confirm(String(this.$t('viewer.confirmLeaveEditing')), String(this.$t('common.confirm')), {
        type: 'warning',
      })
      this.cancelEditTopbar()
      action()
    } catch (e) {
      this.$log?.error?.((e as Error).toString())
    }
  }

  private toAddVisualization(): void {
    this.editingWidget = null
    this.isAddingWidget = true
  }

  private toCreateDashboard() {
    this.creatingInTopbar = true
    this.$nextTick(() => {
      const input = this.$refs.newNameInput as unknown as { focus(): void }
      input && input.focus && input.focus()
    })
  }

  private async onDashboardSelected(dashboard: DashboardModel): Promise<void> {
    await this.selectDashboard(dashboard)
  }

  private async onDashboardSelectChange(id: string): Promise<void> {
    await this.selectDashboardById(id)
  }

  /**
   * Handle dashboard reordering
   * @param newOrderIds
   */
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
    this.toEditDashboard()
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

  private async handleCreateDashboardTopbar(): Promise<void> {
    await this.saveDashboard(this.newDashboard)
    this.cancelCreateTopbar()
  }

  private cancelCreateTopbar(): void {
    this.creatingInTopbar = false
    this.newDashboard = { name: '', description: '' }
  }

  private async handleSaveDashboardEdit(): Promise<void> {
    if (!this.selectedDashboard?.id) return

    const updates = {
      id: this.selectedDashboard.id,
      ...this.editDashboard,
    }
    await this.saveDashboard(updates)
    this.cancelEditTopbar()
  }

  private cancelAddWidget(): void {
    this.isAddingWidget = false
    this.editingWidget = null
  }

  private async handleSaveWidgetConfig(payload: Partial<WidgetModel>): Promise<void> {
    if (this.editingWidget?.id) {
      const { widgetService } = useServices()
      await widgetService.update(this.editingWidget.id, payload)
      this.$message.success(String(this.$t('common.saveSuccess') || 'Saved'))
      await this.loadCurrentDashboardWidgets()
    } else {
      await this.createWidget(payload)
    }
    this.cancelAddWidget()
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

  private toEditDashboard(): void {
    if (!this.selectedDashboard) return

    this.editingInTopbar = true
    this.editDashboard = {
      name: this.selectedDashboard.name,
      description: this.selectedDashboard.description,
    }

    this.$nextTick(() => {
      const input = this.$refs.editNameInput as unknown as { focus(): void }
      input?.focus?.()
    })
  }

  private cancelEditTopbar(): void {
    this.editingInTopbar = false
    this.editDashboard = { name: '', description: '' }
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

  .dashboard-header {
    position: absolute;
    height: 59px;
    top: 0;
    right: 0;
    padding: 16px;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-default);
    z-index: 999;
    transition: all 0.3s ease-in-out;

    .header-container {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 16px;

      .sidebar-toggle-button {
        margin-right: 16px;

        .icon-show-connections {
          font-size: 20px;
          cursor: pointer;
          color: var(--color-text-title);
          &:hover {
            color: var(--color-text-title);
          }
        }
      }

      .header-main-content {
        display: flex;
        align-items: center;
        flex: 1;
        width: 100%;
        .flex-spacer {
          flex: 1;
        }

        .dashboard-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-title);
          margin: 0;
        }

        .topbar-dashboard-view {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          .dashboard-info-section {
            display: flex;
            align-items: center;
          }

          .dashboard-actions-section {
            display: flex;
            align-items: center;
          }

          .add-widget-button {
            flex-shrink: 0;
          }
        }
        .dashboard-create-form,
        .dashboard-view-section,
        .dashboard-edit-form {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .dashboard-edit-icon {
          color: var(--color-text-tips);
          transition: 0.2s color ease;
          display: inline-flex;
          align-items: center;
          height: 20px;
          line-height: 1;
          &:hover {
            color: var(--color-text-title);
          }
          .el-icon-edit {
            font-size: 18px;
            font-weight: 500;
          }
        }
      }
    }
  }

  .dashboards-view {
    height: calc(100% - 59px);
    margin-top: 59px;
    overflow: auto;
    transition: all 0.3s ease-in-out;
  }
  .full-height {
    height: 100%;
    margin-top: 0;
  }
}

.dashboard-skeleton-page {
  margin: 30px;
  overflow-x: hidden;
}

.widget-skeleton-page {
  margin: 30px;
  overflow-x: hidden;
}

.dashboard-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  color: var(--color-text-title);

  h2 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-title);
  }

  p {
    margin: 0;
    color: var(--color-text-light);
  }
}

.no-dashboards-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  color: var(--color-text-title);

  h2 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-title);
  }

  p {
    margin: 0;
    color: var(--color-text-light);
  }
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
</style>
