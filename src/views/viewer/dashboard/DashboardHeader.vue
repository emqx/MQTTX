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
            <!-- With the list open, its selected row already names the dashboard -->
            <template v-if="!showDashboardsList">
              <el-select
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
                v-if="selectedDashboard"
                href="javascript:;"
                class="dashboard-edit-icon"
                :title="$t('common.edit')"
                @click="toEditDashboard"
              >
                <i class="el-icon-edit"></i>
              </a>
            </template>
            <TimeRangeSelect
              v-if="selectedDashboard"
              v-model="localTimeRangeModel"
              size="mini"
              compact
              @range-relative="$emit('time-range-select', $event)"
              :show-live-mode="true"
              :time-range-type="timeRangeType"
              :duration="duration"
            />
            <div class="flex-spacer"></div>
            <el-button
              v-if="selectedDashboard"
              size="small"
              class="add-widget-button"
              icon="el-icon-plus"
              @click="$emit('add-visualization')"
            >
              {{ $t('viewer.addWidget') }}
            </el-button>
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
  @Prop({ required: true }) listOffset!: number
  @Prop({ required: true }) selectedDashboardId!: string | null
  @Prop({ required: true }) dashboards!: DashboardModel[]
  @Prop({ required: true }) selectedDashboard!: DashboardModel | null
  @Prop({ required: true }) timeRangeModel!: [string, string]
  @Prop({ required: true }) timeRangeType!: 'live' | 'static'
  @Prop({ required: true }) duration!: number
  @Prop({ required: true }) isAddingWidget!: boolean

  private creatingInTopbar = false
  private editingInTopbar = false
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
    return this.showDashboardsList ? `${this.listOffset}px` : '0px'
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
  height: 48px;
  top: 0;
  right: 0;
  z-index: 999;
  transition: all 0.3s ease-in-out;

  .header-container {
    display: flex;
    align-items: center;
    height: 100%;
    // Lines up with the 12px inset of the widgets below
    padding: 0 12px;

    .sidebar-toggle-button {
      margin-right: 16px;

      .icon-show-connections {
        font-size: 18px;
        cursor: pointer;
        color: var(--color-text-default);
        &:hover {
          color: var(--color-main-green);
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

      .dashboard-create-form,
      .dashboard-view-section,
      .dashboard-edit-form {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
      }
      .dashboard-view-section {
        gap: 8px;
      }

      // Renaming is a secondary action: the pencil is only revealed while the
      // dashboard switcher is hovered or the pencil is focused.
      .dashboard-edit-icon {
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        color: var(--color-text-light);
        opacity: 0;
        transition: opacity 0.15s ease, color 0.15s ease;

        &:hover,
        &:focus {
          color: var(--color-main-green);
          opacity: 1;
        }

        .el-icon-edit {
          font-size: 15px;
        }
      }
      // Hovering the dashboard switcher reveals it.
      .dashboard-view-section > .el-select:hover + .dashboard-edit-icon {
        opacity: 1;
      }

      // Element's small button (1px border, 32px) with the theme's colours.
      .add-widget-button.el-button {
        flex-shrink: 0;
        height: 32px;
        padding: 0 12px;
        line-height: 30px;
        border: 1px solid var(--color-border-default);
        border-radius: 6px;
        background: var(--color-bg-normal);
        color: var(--color-text-title);
        font-size: 13px;
        font-weight: 500;
        transition: color 0.15s ease, border-color 0.15s ease;

        i {
          font-size: 14px;
        }

        &:hover,
        &:focus {
          border-color: var(--color-main-green);
          background: var(--color-bg-normal);
          color: var(--color-main-green);
        }
      }
    }
  }
}
</style>
