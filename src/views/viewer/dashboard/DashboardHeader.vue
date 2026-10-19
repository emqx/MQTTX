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
              :title="$t('common.edit')"
              @click="toEditDashboard"
            >
              <i class="el-icon-edit"></i>
            </a>
            <div v-if="!showDashboardsList" class="flex-spacer"></div>
            <TimeRangeSelect
              v-if="!showDashboardsList && selectedDashboard"
              v-model="localTimeRangeModel"
              :time-range-type="timeRangeType"
              :duration="duration"
              size="mini"
              @range-relative="$emit('time-range-select', $event)"
            />
            <a
              v-if="!showDashboardsList && selectedDashboard"
              href="javascript:;"
              class="add-widget-button"
              @click="$emit('add-visualization')"
            >
              <i class="el-icon-plus"></i>
              <span>{{ $t('viewer.addWidget') }}</span>
            </a>
            <template v-else>
              <div v-if="selectedDashboard" class="topbar-dashboard-view">
                <div class="dashboard-info-section">
                  <h2 class="dashboard-title">
                    {{ selectedDashboard.name }}
                  </h2>
                  <a
                    href="javascript:;"
                    class="dashboard-edit-icon"
                    :title="$t('common.edit')"
                    @click="toEditDashboard"
                  >
                    <i class="el-icon-edit"></i>
                  </a>
                </div>
                <div class="dashboard-actions-section">
                  <TimeRangeSelect
                    v-model="localTimeRangeModel"
                    size="mini"
                    @range-relative="$emit('time-range-select', $event)"
                    :show-live-mode="true"
                    :time-range-type="timeRangeType"
                    :duration="duration"
                  />
                  <a href="javascript:;" class="add-widget-button" @click="$emit('add-visualization')">
                    <i class="el-icon-plus"></i>
                    <span>{{ $t('viewer.addWidget') }}</span>
                  </a>
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

      .dashboard-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-title);
        margin: 0;
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .topbar-dashboard-view {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        min-width: 0;
        .dashboard-info-section {
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .dashboard-actions-section {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 12px;
        }
      }
      .dashboard-create-form,
      .dashboard-view-section,
      .dashboard-edit-form {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
      }

      // Renaming is a secondary action: the pencil is only revealed while the
      // title area is hovered or focused.
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
      // Hovering the title area reveals it; in the list-hidden variant the
      // title is an el-select, so hovering that has the same effect.
      .dashboard-info-section:hover .dashboard-edit-icon,
      .dashboard-info-section:focus-within .dashboard-edit-icon,
      .dashboard-view-section > .el-select:hover + .dashboard-edit-icon {
        opacity: 1;
      }

      // Same secondary action language as the other page headers: an icon plus
      // a label in the title colour, 32px tall so the whole row lines up.
      .add-widget-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        height: 32px;
        padding: 0 4px;
        color: var(--color-text-title);
        font-size: 13px;
        font-weight: 500;
        line-height: 1;
        white-space: nowrap;
        transition: color 0.15s ease;

        i {
          font-size: 18px;
        }

        &:hover {
          color: var(--color-main-green);
        }
      }
    }
  }
}
</style>
