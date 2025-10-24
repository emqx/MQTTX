<template>
  <div class="dashboard-header" :style="{ left: leftValue }" v-if="!isAddingWidget">
    <div class="header-container">
      <div
        v-if="!showDashboardsList"
        class="sidebar-toggle-button"
        @click="$emit('toggle-list', true)"
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
              :placeholder="$t('connections.name')"
              style="width: 180px; margin-right: 8px"
            />
            <el-input
              size="mini"
              v-model="editDashboard.description"
              :placeholder="$t('viewer.description')"
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
              v-model="localSelectedDashboardId"
              size="mini"
              :placeholder="$t('viewer.dashboard')"
              @change="$emit('dashboard-selected', $event)"
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
              @click="$emit('add-visualization')"
            >
              {{ $t('common.new') }}
            </el-button>
            <TimeRangeSelect
              v-if="!showDashboardsList && selectedDashboard"
              v-model="localTimeRangeModel"
              :time-range-type="timeRangeType"
              :duration="duration"
              size="mini"
              style="margin-left: 8px; width: 200px"
              @range-relative="$emit('time-range-select', $event)"
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
                    @click="$emit('add-visualization')"
                  >
                    {{ $t('common.new') }}
                  </el-button>
                  <TimeRangeSelect
                    v-model="localTimeRangeModel"
                    size="mini"
                    @range-relative="$emit('time-range-select', $event)"
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
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import TimeRangeSelect from '@/components/TimeRangeSelect.vue'

@Component({
  components: {
    TimeRangeSelect,
  },
})
export default class DashboardHeader extends Vue {
  @Prop({ required: true }) showDashboardsList!: boolean
  @Prop({ required: true }) selectedDashboardId!: string | null
  @Prop({ required: true }) dashboards!: DashboardModel[]
  @Prop({ required: true }) selectedDashboard!: DashboardModel | null
  @Prop({ required: true }) timeRangeModel!: [string, string]
  @Prop({ required: true }) timeRangeType!: 'live' | 'static'
  @Prop({ required: true }) duration!: number
  @Prop({ required: true }) isAddingWidget!: boolean

  private creatingInTopbar: boolean = false
  private editingInTopbar: boolean = false
  private newDashboard: Partial<DashboardModel> = { name: '', description: '' }
  private editDashboard: Partial<DashboardModel> = { name: '', description: '' }

  get localSelectedDashboardId(): string | null {
    return this.selectedDashboardId
  }

  set localSelectedDashboardId(value: string | null) {
    this.$emit('update:selectedDashboardId', value)
  }

  get localTimeRangeModel(): [string, string] {
    return this.timeRangeModel
  }

  set localTimeRangeModel(value: [string, string]) {
    this.$emit('update:timeRangeModel', value)
  }

  get leftValue(): string {
    return this.showDashboardsList ? '230px' : '0px'
  }

  private toCreateDashboard() {
    this.creatingInTopbar = true
    this.$nextTick(() => {
      const input = this.$refs.newNameInput as unknown as { focus(): void }
      input && input.focus && input.focus()
    })
  }

  private async handleCreateDashboardTopbar(): Promise<void> {
    this.$emit('create-dashboard', this.newDashboard)
    this.cancelCreateTopbar()
  }

  private cancelCreateTopbar(): void {
    this.creatingInTopbar = false
    this.newDashboard = { name: '', description: '' }
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

  private async handleSaveDashboardEdit(): Promise<void> {
    if (!this.selectedDashboard?.id) return
    const updates = {
      id: this.selectedDashboard.id,
      ...this.editDashboard,
    }
    this.$emit('save-dashboard', updates)
    this.cancelEditTopbar()
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
</style>
