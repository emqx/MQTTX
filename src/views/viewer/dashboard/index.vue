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
                New
              </el-button>
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
                  <el-button
                    size="mini"
                    type="primary"
                    icon="el-icon-plus"
                    class="add-widget-button"
                    @click="toAddVisualization"
                  >
                    New
                  </el-button>
                </div>
              </template>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <!-- Dashboard view (Canvas Layout) -->
    <div class="dashboards-view" :class="{ 'full-height': isAddingWidget }" :style="{ marginLeft: detailLeftValue }">
      <template v-if="isLoadingData">
        <el-skeleton class="dashboard-skeleton-page" :row="8" animated />
      </template>
      <template v-else>
        <template v-if="isAddingWidget">
          <WidgetConfig :initial-widget="editingWidget" @cancel="cancelAddWidget" @save="handleSaveWidgetConfig" />
        </template>
        <!-- if no dashboard is selected, show the no dashboards placeholder -->
        <template v-else>
          <div v-if="isEmpty" class="no-dashboards-placeholder">
            <h2>{{ ' No Dashboards' }}</h2>
            <p>
              {{ 'Create a new dashboard to get started' }}
            </p>
            <el-button
              type="primary"
              class="primary-btn"
              icon="el-icon-plus"
              style="font-size: 16px; padding: 10px 32px; border-radius: 6px; margin-top: 16px"
              @click="toCreateDashboard"
            >
              {{ ' Create Dashboard' }}
            </el-button>
          </div>
          <!-- if a dashboard is selected, show the dashboard view -->
          <template v-else>
            <template v-if="isLoadingWidgets">
              <el-skeleton class="widget-skeleton-page" :row="6" animated />
            </template>
            <!-- if the dashboard has widgets, show the dashboard view -->
            <template v-else-if="selectedDashboardHasWidgets">
              <DashboardView
                :dashboard-id="selectedDashboardId"
                :widgets="dashboardWidgets"
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
import useServices from '@/database/useServices'
import { WidgetModel } from '@/types/widgets'

@Component({
  components: {
    DashboardsList,
    EmptyPage,
    DashboardView,
    WidgetConfig,
  },
})
export default class Dashboards extends Vue {
  private showDashboardsList: boolean = true
  private isLoadingData: boolean = false
  private isLoadingWidgets: boolean = false
  private isAddingWidget: boolean = false
  private editingWidget: WidgetModel | null = null
  private creatingInTopbar: boolean = false
  private editingInTopbar: boolean = false

  private dashboards: DashboardModel[] = []
  private selectedDashboard: DashboardModel | null = null
  private selectedDashboardId: string | null = null
  private dashboardWidgets: WidgetModel[] = []

  private newDashboard: Partial<DashboardModel> = { name: '', description: '' }
  private editDashboard: Partial<DashboardModel> = { name: '', description: '' }

  private isSelectingDashboard: boolean = false

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
    await this.initializeDashboards()
  }

  /**
   * Initialize the dashboard system -- load all dashboards and set initial selection
   */
  private async initializeDashboards(): Promise<void> {
    this.isLoadingData = true
    try {
      await this.loadDashboards()
      await this.setInitialDashboardSelection()
      await this.loadCurrentDashboardWidgets()
    } finally {
      this.isLoadingData = false
    }
  }

  /**
   * Load all dashboards (ordered by orderId)
   */
  private async loadDashboards(): Promise<void> {
    const { dashboardService } = useServices()
    this.dashboards = await dashboardService.getAll()
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

    this.isLoadingWidgets = true
    try {
      const { widgetService } = useServices()
      this.dashboardWidgets = await widgetService.getAll(this.selectedDashboardId)
    } catch (error) {
      console.error('[INDEX] Error loading dashboard widgets:', error)
      this.dashboardWidgets = []
    } finally {
      this.isLoadingWidgets = false
    }
  }

  private async refreshDashboards(): Promise<void> {
    await this.loadDashboards()
    if (this.selectedDashboardId) {
      const found = this.dashboards.find((d) => d.id === this.selectedDashboardId)
      if (found) {
        this.selectedDashboard = found
      } else {
        this.clearDashboardSelection()
      }
    }
  }

  private async refreshCurrentDashboard(): Promise<void> {
    await Promise.all([this.refreshDashboards(), this.loadCurrentDashboardWidgets()])
  }

  private setSelectedDashboard(dashboard: DashboardModel, persist: boolean = true): void {
    this.selectedDashboard = dashboard
    this.selectedDashboardId = dashboard.id || null

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

  private async selectDashboard(dashboard: DashboardModel): Promise<void> {
    if (this.isSelectingDashboard) return
    this.isSelectingDashboard = true

    try {
      if (this.editingInTopbar) {
        await this.handleEditingConfirmation(() => {
          this.setSelectedDashboard(dashboard)
          this.loadCurrentDashboardWidgets()
        })
        return
      }
      this.setSelectedDashboard(dashboard)
      await this.loadCurrentDashboardWidgets()
    } finally {
      this.isSelectingDashboard = false
    }
  }

  private async selectDashboardById(id: string): Promise<void> {
    const dashboard = this.dashboards.find((d) => d.id === id)
    if (dashboard) {
      await this.selectDashboard(dashboard)
    }
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
      await this.$confirm(
        String(this.$t('common.confirmLeaveEditing') || 'Discard current edits and switch dashboard?'),
        String(this.$t('common.confirm') || 'Confirm'),
        { type: 'warning' },
      )
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
        this.$message.error('Failed to save dashboard order')
        await this.refreshDashboards()
      }
    } catch (error) {
      console.error('Error updating dashboard order:', error)
      this.$message.error('Failed to save dashboard order')
      await this.refreshDashboards()
    }
  }

  private onEditDashboardFromList(dashboard: DashboardModel): void {
    this.setSelectedDashboard(dashboard)
    this.toEditDashboard()
  }

  private async onDeleteDashboardFromList(dashboard: DashboardModel): Promise<void> {
    if (!dashboard?.id) return

    try {
      await this.$confirm(
        String(this.$t('common.confirmDelete') || 'Are you sure to delete this item?'),
        String(this.$t('common.confirm') || 'Confirm'),
        { type: 'warning' },
      )
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
      await this.refreshDashboards()
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
      await this.refreshDashboards()

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
      this.$message.error('No dashboard selected')
      return
    }

    try {
      if (!widgetData.type) {
        throw new Error('Widget type is required')
      }

      if (!widgetData.connectionId) {
        throw new Error('Connection is required')
      }

      if (!widgetData.topicPattern) {
        throw new Error('Topic pattern is required')
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
      await this.$confirm(
        String(this.$t('common.confirmDelete') || 'Are you sure to delete this item?'),
        String(this.$t('common.confirm') || 'Confirm'),
        { type: 'warning' },
      )
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
