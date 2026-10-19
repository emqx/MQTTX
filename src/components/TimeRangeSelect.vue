<template>
  <div class="time-range-select" :class="{ 'is-live': showLiveLabel }">
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

@Component
export default class TimeRangeSelect extends Vue {
  @Prop({ required: true }) public value!: [string, string]
  @Prop({ default: 'small' }) public size!: string
  @Prop({ default: false }) public showLiveMode!: boolean
  @Prop({ default: 'static' }) public timeRangeType!: 'live' | 'static'
  @Prop({ default: 24 * 60 }) public duration!: number

  private modelValue = this.value
  private currentDuration: number | null = null
  private isLiveMode = false
  private isFromShortcut = false
  private shortcutLiveMode = false
  private shortcutDuration: number | null = null

  // Shortcut durations in minutes mapped to the label shown while live.
  private readonly liveLabels: Record<number, string> = {
    5: 'common.last5Minutes',
    30: 'common.last30Minutes',
    60: 'common.lastHour',
    1440: 'common.lastDay',
    10080: 'common.lastWeek',
  }

  /**
   * In live mode the picker would only show a rolling window's start and end
   * dates, which says nothing useful. Show the window name instead while still
   * allowing the picker to open on click (it stays underneath, transparent).
   */
  get liveLabel(): string {
    if (!this.isLiveMode || !this.currentDuration) return ''
    const minutes = Math.round(this.currentDuration / (60 * 1000))
    const key = this.liveLabels[minutes]
    return key ? String(this.$t(key)) : ''
  }

  get showLiveLabel(): boolean {
    return this.isLiveMode && !!this.liveLabel
  }

  // Initialize with props
  private mounted() {
    this.isLiveMode = this.timeRangeType === 'live'
    this.currentDuration = this.duration * 60 * 1000 // Convert minutes to milliseconds
  }

  @Watch('value')
  private onValueChange(newVal: [string, string]) {
    this.modelValue = newVal
  }

  @Watch('timeRangeType')
  private onTimeRangeTypeChange() {
    this.isLiveMode = this.timeRangeType === 'live'
  }

  @Watch('duration')
  private onDurationChange() {
    this.currentDuration = this.duration * 60 * 1000 // Convert minutes to milliseconds
  }

  @Watch('modelValue')
  private onModelValueChange(newVal: [string, string] | null) {
    this.$emit('input', newVal)
    this.$emit('change', newVal)

    // Only emit range-relative for shortcuts, not for external changes (like dashboard switches)
    if (this.isFromShortcut) {
      // Use shortcut-specific values
      const finalIsLive = this.shortcutLiveMode
      const finalDuration = this.shortcutDuration

      this.$emit('range-relative', {
        timeRange: newVal,
        duration: finalDuration || 24 * 60 * 60 * 1000, // Default to 24 hours in milliseconds
        isLive: finalIsLive,
      })

      // Reset shortcut flags after emitting
      this.isFromShortcut = false
      this.shortcutLiveMode = false
      this.shortcutDuration = null
    }
  }

  private pickerOptions = {
    disabledDate(time: Date) {
      return time.getTime() > Date.now()
    },
    shortcuts: [
      {
        text: this.$t('common.last5Minutes'),
        onClick: (picker: any) => {
          this.setShortcutValues(true, 5 * 60 * 1000)
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 5 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.last30Minutes'),
        onClick: (picker: any) => {
          this.setShortcutValues(true, 30 * 60 * 1000)
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 30 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.lastHour'),
        onClick: (picker: any) => {
          this.setShortcutValues(true, 60 * 60 * 1000)
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 60 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.lastDay'),
        onClick: (picker: any) => {
          this.setShortcutValues(true, 24 * 60 * 60 * 1000)
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 24 * 60 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.lastWeek'),
        onClick: (picker: any) => {
          this.setShortcutValues(true, 7 * 24 * 60 * 60 * 1000)
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
    ],
  }

  private setShortcutValues(isLive: boolean, duration: number) {
    this.isFromShortcut = true
    this.shortcutLiveMode = isLive
    this.shortcutDuration = duration
  }
}
</script>

<style lang="scss">
.time-range-select {
  position: relative;
  display: inline-flex;
  align-items: center;

  // Keep Element's own datetimerange width (400px) - the same width the
  // traffic monitor page uses - so the full start/end time always fits, and
  // give the separator symmetric padding on both sides of the arrow.
  .time-range-picker .el-range-separator {
    width: auto;
    min-width: 14px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
      padding: 0 10px;
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
