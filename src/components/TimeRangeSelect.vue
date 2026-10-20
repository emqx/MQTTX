<template>
  <div class="time-range-select" :class="{ 'is-live': showLiveLabel, 'is-compact': compact }">
    <span v-if="showLiveLabel" class="time-range-live-label">
      <i class="el-icon-time"></i>
      <span>{{ liveLabel }}</span>
    </span>
    <el-date-picker
      v-model="modelValue"
      type="datetimerange"
      :start-placeholder="$t('common.startTime')"
      :end-placeholder="$t('common.endTime')"
      :picker-options="pickerOptions"
      range-separator="→"
      :format="displayFormat"
      value-format="yyyy-MM-dd HH:mm:ss:SSS"
      :size="size"
      popper-class="time-range-picker-popper"
      class="time-range-picker"
    >
    </el-date-picker>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

// Live window duration (in minutes, as passed by the dashboard) → label key.
const LIVE_RANGE_LABELS: Record<number, string> = {
  5: 'common.last5Minutes',
  30: 'common.last30Minutes',
  60: 'common.lastHour',
  1440: 'common.lastDay',
  10080: 'common.lastWeek',
}

@Component
export default class TimeRangeSelect extends Vue {
  @Prop({ required: true }) public value!: [string, string]
  @Prop({ default: 'small' }) public size!: string
  @Prop({ default: 'static' }) public timeRangeType!: 'live' | 'static'
  @Prop({ default: 24 * 60 }) public duration!: number
  // Dashboard header variant: short displayed dates and a content-sized box
  // instead of Element's fixed 400px range editor.
  @Prop({ default: false }) public compact!: boolean

  private modelValue = this.value
  // Set by a shortcut click so the resulting model change emits `range-relative`
  // (a normal pick or an external change must not).
  private isFromShortcut = false
  private shortcutDuration: number | null = null

  /**
   * In live mode the picker would only show a rolling window's start and end
   * dates, which says nothing useful. Show the window name instead while still
   * allowing the picker to open on click (it stays underneath, transparent).
   */
  get liveLabel(): string {
    if (this.timeRangeType !== 'live') return ''

    const key = LIVE_RANGE_LABELS[this.duration]
    return key ? String(this.$t(key)) : ''
  }

  get showLiveLabel(): boolean {
    return !!this.liveLabel
  }

  /** Display-only format; value-format is untouched. */
  get displayFormat(): string | undefined {
    return this.compact ? 'MM-dd HH:mm' : undefined
  }

  @Watch('value')
  private onValueChange(newVal: [string, string]) {
    this.modelValue = newVal
  }

  @Watch('modelValue')
  private onModelValueChange(newVal: [string, string] | null) {
    this.$emit('input', newVal)
    this.$emit('change', newVal)

    // Only emit range-relative for shortcuts, not for external changes (like dashboard switches)
    if (this.isFromShortcut) {
      this.$emit('range-relative', {
        timeRange: newVal,
        duration: this.shortcutDuration || 24 * 60 * 60 * 1000, // Default to 24 hours in milliseconds
        isLive: true,
      })

      this.isFromShortcut = false
      this.shortcutDuration = null
    }
  }

  private pickerOptions = {
    disabledDate(time: Date) {
      return time.getTime() > Date.now()
    },
    shortcuts: [
      { text: this.$t('common.last5Minutes'), minutes: 5 },
      { text: this.$t('common.last30Minutes'), minutes: 30 },
      { text: this.$t('common.lastHour'), minutes: 60 },
      { text: this.$t('common.lastDay'), minutes: 24 * 60 },
      { text: this.$t('common.lastWeek'), minutes: 7 * 24 * 60 },
    ].map(({ text, minutes }) => ({
      text,
      onClick: (picker: any) => this.applyShortcut(picker, minutes),
    })),
  }

  // Must be a method, not inline in the field initializer above: while
  // vue-class-component collects data it constructs the class on a temporary
  // object, and only existing vm keys (props, methods, computed) are proxied
  // to the real instance. `this.isFromShortcut = true` inside the initializer
  // would write to that temporary object and the component would never see it.
  private applyShortcut(picker: any, minutes: number): void {
    this.isFromShortcut = true
    this.shortcutDuration = minutes * 60 * 1000

    const end = new Date()
    const start = new Date(end.getTime() - minutes * 60 * 1000)
    picker.$emit('pick', [start, end])
  }
}
</script>

<style lang="scss">
.time-range-select {
  position: relative;
  display: inline-flex;
  align-items: center;

  // Symmetric range editor: each time is centred in its own half, the arrow
  // sits in the middle and the two paddings match. The clock icon used to
  // reserve a slot on the left while the (conditionally rendered) clear icon
  // did not on the right, which is what pushed the end time to the border.
  .time-range-picker.el-range-editor {
    position: relative;
    height: 32px;
    padding: 0 12px;

    .el-range-input {
      flex: 1 1 0;
      width: auto;
      text-align: center;
    }

    .el-range-separator {
      flex: 0 0 auto;
      width: auto;
      min-width: 12px;
      padding: 0 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    // Out of flow: showing the clear icon never shifts the times.
    .el-range__close-icon {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;
      float: none;
      width: auto;
      line-height: 1;
    }

    .el-range__icon {
      display: none;
    }
  }

  &.is-live {
    .time-range-live-label {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 12px;
      border: 1px solid var(--color-border-default);
      border-radius: 4px;
      background: var(--color-bg-normal);
      color: var(--color-text-default);
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;

      i {
        flex-shrink: 0;
        color: var(--color-text-light);
      }

      span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    // Keep the picker clickable underneath the read-only label.
    .time-range-picker {
      opacity: 0;
    }

    &:hover .time-range-live-label {
      border-color: var(--color-main-green);
      color: var(--color-main-green);

      i {
        color: var(--color-main-green);
      }
    }
  }

  // Dashboard header: a short displayed date and a box that follows its own
  // content (~264px) instead of Element's fixed 400px range editor.
  &.is-compact {
    .time-range-picker.el-range-editor {
      width: auto;
      padding: 0 10px;

      // Sized to "MM-dd HH:mm" so the padding, not slack inside the inputs,
      // sets the spacing.
      .el-range-input {
        flex: 0 0 auto;
        width: 10ch;
        text-align: center;
      }

      .el-range-separator {
        padding: 0 6px;
      }

      // The shortcuts reset the range; clearing it leaves the dashboard empty.
      .el-range__close-icon {
        display: none;
      }
    }

    // In live mode the label is the in-flow child that defines the width, and
    // the (transparent, clickable) picker fills the wrapper underneath it.
    &.is-live {
      .time-range-picker.el-range-editor {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        width: auto;
        // Clip the wider inputs so the invisible picker cannot swallow clicks
        // on the controls next to it.
        overflow: hidden;
      }

      .time-range-live-label {
        position: relative;
        left: auto;
        right: auto;
        top: auto;
        bottom: auto;
        height: 32px;
        padding: 0 10px;
      }
    }
  }
}

.time-range-picker-popper {
  transform: translateX(-25px) !important;
  .el-button {
    border: none;
    background-color: transparent;
    color: var(--color-text-default);
    &:hover {
      color: var(--color-main-green);
      background-color: transparent;
    }
  }
}
</style>
