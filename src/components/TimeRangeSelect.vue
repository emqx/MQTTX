<template>
  <el-date-picker
    v-model="modelValue"
    type="datetimerange"
    :start-placeholder="$t('common.startTime')"
    :end-placeholder="$t('common.endTime')"
    :picker-options="pickerOptions"
    value-format="yyyy-MM-dd HH:mm:ss:SSS"
    :size="size"
    popper-class="time-range-picker-popper"
  >
  </el-date-picker>
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
  private isLiveMode: boolean = false
  private isFromShortcut: boolean = false
  private shortcutLiveMode: boolean = false
  private shortcutDuration: number | null = null

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
