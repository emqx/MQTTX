<template>
  <el-date-picker
    v-model="modelValue"
    type="datetimerange"
    :start-placeholder="$t('common.startTime')"
    :end-placeholder="$t('common.endTime')"
    :picker-options="pickerOptions"
    value-format="yyyy-MM-dd HH:mm:ss:SSS"
    size="small"
    popper-class="time-range-picker-popper"
  >
  </el-date-picker>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class TimeRangeSelect extends Vue {
  @Prop({ required: true }) public value!: [string, string]

  private modelValue = this.value

  @Watch('value')
  private onValueChange(newVal: [string, string]) {
    this.modelValue = newVal
  }

  @Watch('modelValue')
  private onModelValueChange(newVal: [string, string] | null) {
    this.$emit('input', newVal)
    this.$emit('change', newVal)
  }

  private pickerOptions = {
    disabledDate(time: Date) {
      return time.getTime() > Date.now()
    },
    shortcuts: [
      {
        text: this.$t('common.last5Minutes'),
        onClick(picker: any) {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 5 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.last30Minutes'),
        onClick(picker: any) {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 30 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.lastHour'),
        onClick(picker: any) {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 60 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.lastDay'),
        onClick(picker: any) {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 24 * 60 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
      {
        text: this.$t('common.lastWeek'),
        onClick(picker: any) {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000)
          picker.$emit('pick', [start, end])
        },
      },
    ],
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
