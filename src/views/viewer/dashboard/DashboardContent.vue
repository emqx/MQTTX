<template>
  <div class="dashboards-view" :class="{ 'full-height': isAddingWidget }" :style="{ marginLeft: detailLeftValue }">
    <template v-if="loadingState.initializing">
      <el-skeleton class="dashboard-skeleton-page" :row="8" animated />
    </template>
    <template v-else>
      <template v-if="isAddingWidget">
        <WidgetConfig :initial-widget="editingWidget" @cancel="cancelAddWidget" @save="handleSaveWidgetConfig" />
      </template>
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
            @click="$emit('create-dashboard')"
          >
            {{ $t('viewer.createDashboard') }}
          </el-button>
        </div>
        <template v-else>
          <template v-if="loadingState.widgets">
            <el-skeleton class="widget-skeleton-page" :row="6" animated />
          </template>
          <template v-else-if="selectedDashboardHasWidgets">
            <DashboardView
              :dashboard-id="selectedDashboardId"
              :widgets="dashboardWidgets"
              :time-range="timeRange"
              :time-range-type="timeRangeType"
              :duration="duration"
              @layout-changed="$emit('layout-changed', $event)"
              @edit-widget="$emit('edit-widget', $event)"
              @remove-widget="$emit('remove-widget', $event)"
            />
          </template>
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
              @click="$emit('add-visualization')"
            >
              {{ $t('viewer.addVisualization') }}
            </el-button>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import DashboardView from './DashboardView.vue'
import WidgetConfig from './WidgetConfig.vue'
import useServices from '@/database/useServices'

@Component({
  components: {
    DashboardView,
    WidgetConfig,
  },
})
export default class DashboardContent extends Vue {
  @Prop({ required: true }) loadingState!: { initializing: boolean; widgets: boolean }
  @Prop({ required: true }) showDashboardsList!: boolean
  @Prop({ required: true }) selectedDashboardId!: string | null
  @Prop({ required: true }) dashboardWidgets!: WidgetModel[]
  @Prop({ required: true }) timeRange!: [string, string]
  @Prop({ required: true }) timeRangeType!: 'live' | 'static'
  @Prop({ required: true }) duration!: number
  @Prop({ required: true }) isEmpty!: boolean
  @Prop({ required: true }) selectedDashboardHasWidgets!: boolean
  @Prop({ default: false }) isAddingWidget!: boolean
  @Prop({ default: null }) editingWidget!: WidgetModel | null

  get detailLeftValue(): string {
    return this.showDashboardsList ? '230px' : '0px'
  }

  private cancelAddWidget(): void {
    this.$emit('cancel-add')
  }

  private async handleSaveWidgetConfig(payload: Partial<WidgetModel>): Promise<void> {
    if (this.editingWidget?.id) {
      const { widgetService } = useServices()
      await widgetService.update(this.editingWidget.id, payload)
      this.$message.success(String(this.$t('common.saveSuccess') || 'Saved'))
      this.$emit('refresh-widgets')
    } else {
      this.$emit('create-widget', payload)
    }
    this.$emit('cancel-add')
  }

  // Note: onEditWidget, onRemoveWidget are emitted to parent
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

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
</style>
