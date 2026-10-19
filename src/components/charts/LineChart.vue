<template>
  <div class="line-chart-container">
    <div :id="id" class="chart-container"></div>
    <div v-if="!hasData" class="no-data-overlay">
      <i class="el-icon-data-line"></i>
      <span>{{ $t('common.noData') }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as echarts from 'echarts/core'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { LineChart as EChartsLineChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { getChartThemeColors } from '@/utils/chartTheme'

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  EChartsLineChart,
  CanvasRenderer,
  UniversalTransition,
])

@Component
export default class LineChart extends Vue {
  @Prop({ required: true }) public id!: string
  // Label for the tooltip / series name (widget title or its value field).
  @Prop({ default: '' }) public seriesName!: string
  @Prop({ default: '#00B572' }) public color!: string
  @Prop({ default: () => ({ chartData: { xData: [], seriesData: [{ name: 'value', data: [] }] } }) })
  public data!: LineData
  @Prop({ default: true }) public smooth!: boolean
  @Prop({ default: true }) public area!: boolean
  @Prop({ default: 'Absolute' }) public thresholdsType!: 'Absolute' | 'Percentage'
  @Prop({ default: () => [] }) public thresholds!: Threshold[]
  @Prop({ default: 24 * 60 }) public duration!: number // Duration in minutes
  @Prop({ default: 'static' }) public timeRangeType!: 'live' | 'static'

  private myChart: echarts.ECharts | null = null
  private resizeObserver: ResizeObserver | null = null
  private resizeTimeout: number | null = null
  private debouncedUpdate!: () => void

  @Getter('currentTheme') private theme!: Theme

  get hasData(): boolean {
    const hasData = this.data.chartData.xData.length > 0
    return hasData
  }

  private getTimeAxisMin(): number {
    if (this.timeRangeType === 'live' && this.duration) {
      const now = new Date().getTime()
      return now - this.duration * 60 * 1000 // Convert minutes to milliseconds
    }
    return undefined as any // Let ECharts auto-determine for static ranges
  }

  private getTimeAxisMax(): number {
    if (this.timeRangeType === 'live' && this.duration) {
      return new Date().getTime()
    }
    return undefined as any // Let ECharts auto-determine for static ranges
  }

  private getTimeSeriesData(): Array<[number, number]> {
    const xData = this.data.chartData.xData
    const yData = this.data.chartData.seriesData[0]?.data || []

    if (xData.length === 0) return []

    // Convert timestamp strings to numbers and pair with values
    const timeSeriesData = xData.map((timestamp, index) => [
      new Date(timestamp).getTime(), // Convert to milliseconds
      yData[index] || 0,
    ])

    // Sort by timestamp to ensure chronological order
    timeSeriesData.sort((a, b) => a[0] - b[0])

    // If we're in live mode with duration, filter out points outside the time window
    if (this.timeRangeType === 'live' && this.duration) {
      const now = new Date().getTime()
      const cutoffTime = now - this.duration * 60 * 1000
      return timeSeriesData.filter(([timestamp]) => timestamp >= cutoffTime) as Array<[number, number]>
    }

    return timeSeriesData as Array<[number, number]>
  }

  private get effectiveMin(): number {
    const seriesData = this.data.chartData.seriesData
    if (!seriesData.length || !seriesData[0] || !seriesData[0].data.length) return 0
    return Math.min(...seriesData[0].data)
  }

  private get effectiveMax(): number {
    const seriesData = this.data.chartData.seriesData
    if (!seriesData.length || !seriesData[0] || !seriesData[0].data.length) return 100
    return Math.max(...seriesData[0].data)
  }

  private get displayColor(): string {
    if (this.thresholds.length === 0) return this.color

    // For line charts, we'll use the color based on the latest data point
    const latestValue = this.data.chartData.seriesData[0].data[this.data.chartData.seriesData[0].data.length - 1]
    if (latestValue === undefined) return this.color

    const absThresholds = this.thresholds
      .map((t) => ({
        absValue:
          this.thresholdsType === 'Absolute'
            ? t.value
            : this.effectiveMin + (this.effectiveMax - this.effectiveMin) * (t.value / 100),
        color: t.color,
      }))
      .sort((a, b) => a.absValue - b.absValue)

    let selectedColor = this.color
    for (const t of absThresholds) {
      if (latestValue >= t.absValue) {
        selectedColor = t.color
      } else {
        break
      }
    }
    return selectedColor
  }

  @Watch('theme')
  @Watch('data', { deep: true })
  @Watch('color')
  @Watch('smooth')
  @Watch('area')
  @Watch('thresholds', { deep: true })
  @Watch('thresholdsType')
  @Watch('duration')
  @Watch('timeRangeType')
  onDataChange() {
    this.debouncedUpdate()
  }

  mounted(): void {
    this.debouncedUpdate = this.debounce(this.updateChart, 100)
    this.$nextTick(() => {
      this.initChart()
      this.setupResizeObserver()
    })
  }

  beforeDestroy(): void {
    this.cleanup()
  }

  private initChart(): void {
    const chartDom = document.getElementById(this.id) as HTMLElement
    if (chartDom) {
      this.myChart = echarts.init(chartDom)
      this.debouncedUpdate()
    }
  }

  private readonly axisSplitNumber = 3

  private formatAxisTime(value: number): string {
    const date = new Date(value)
    const pad = (n: number) => `${n}`.padStart(2, '0')
    if (this.duration > 24 * 60) {
      return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    }
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  private formatTooltipTime(value: number): string {
    const date = new Date(value)
    const pad = (n: number) => `${n}`.padStart(2, '0')
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds(),
    )}`
  }

  /** Decimals needed so two ticks one `interval` apart never render the same. */
  private decimalsForInterval(interval: number): number {
    if (!(interval > 0)) return 2
    return Math.min(6, Math.max(0, Math.ceil(-Math.log10(interval))))
  }

  /** Y axis: thousands separators below 10 000, k/M/B above. */
  private formatAxisValue(value: number, interval: number): string {
    const abs = Math.abs(value)
    if (abs >= 1e9) return `${(value / 1e9).toFixed(this.decimalsForInterval(interval / 1e9))}B`
    if (abs >= 1e6) return `${(value / 1e6).toFixed(this.decimalsForInterval(interval / 1e6))}M`
    if (abs >= 1e4) return `${(value / 1e3).toFixed(this.decimalsForInterval(interval / 1e3))}k`
    const digits = this.decimalsForInterval(interval)
    return value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  /** Tooltip values: keep more precision than the axis ticks. */
  private formatReadableValue(value: number): string {
    const abs = Math.abs(value)
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (abs >= 1e4) return `${(value / 1e3).toFixed(2)}k`
    return value.toLocaleString('en-US', { maximumFractionDigits: 3 })
  }

  /**
   * Approximates the tick interval ECharts will pick so the axis labels can
   * carry just enough decimals. Estimating low only adds decimals, which never
   * makes two ticks collide.
   */
  private estimateAxisInterval(values: number[]): number {
    if (values.length === 0) return 1
    const range = Math.max(...values) - Math.min(...values)
    if (range > 0) return range / this.axisSplitNumber
    return Math.max(Math.abs(values[0]) || 0, 1) * 0.1
  }

  private updateChart(): void {
    if (!this.myChart) return

    const colors = getChartThemeColors()
    const timeSeriesData = this.getTimeSeriesData()

    if (timeSeriesData.length === 0) {
      const option = {
        animation: false,
        backgroundColor: 'transparent',
        grid: { left: 4, right: 8, bottom: 4, top: 12, containLabel: true },
        xAxis: { type: 'time', show: false },
        yAxis: { type: 'value', show: false },
        series: [{ type: 'line', data: [] }],
      }
      this.myChart.setOption(option, true, true)
      return
    }

    const axisInterval = this.estimateAxisInterval(timeSeriesData.map(([, value]) => value))

    const option = {
      animation: false, // Disable all animations to prevent visual corruption
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        textStyle: { color: colors.text, fontSize: 12 },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const data = params[0]
          const time = this.formatTooltipTime(data.data[0])
          const value = this.formatReadableValue(data.data[1])
          return `${time}<br/>${data.seriesName}: ${value}`
        },
      },
      grid: {
        left: 4,
        right: 8,
        top: 12,
        bottom: 4,
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: colors.axis } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: colors.subText,
          fontSize: 10,
          margin: 8,
          hideOverlap: true,
          showMinLabel: false,
          showMaxLabel: false,
          formatter: (value: number) => this.formatAxisTime(value),
        },
        min: this.getTimeAxisMin(),
        max: this.getTimeAxisMax(),
      },
      yAxis: {
        type: 'value',
        // Auto-scale to the data range unless a fixed range is configured.
        scale: true,
        splitNumber: this.axisSplitNumber,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: colors.subText,
          fontSize: 10,
          margin: 6,
          formatter: (value: number) => this.formatAxisValue(value, axisInterval),
        },
        splitLine: { lineStyle: { color: colors.splitLine, type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          name: this.seriesName || 'value',
          smooth: this.smooth,
          // Keep the curve inside the data range on near-identical x values,
          // otherwise smoothing overshoots into vertical spikes.
          smoothMonotone: 'x',
          symbol: 'none',
          data: timeSeriesData, // Use the filtered and sorted data
          animation: false, // Disable series animation
          lineStyle: { color: this.displayColor, width: 2 },
          areaStyle: this.area
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: `${this.displayColor}80` },
                  { offset: 1, color: `${this.displayColor}00` },
                ]),
              }
            : undefined,
          connectNulls: false, // Don't connect points across gaps
        },
      ],
    }

    this.myChart.setOption(option, true, true) // notMerge: true, lazyUpdate: true
  }

  private setupResizeObserver(): void {
    const container = document.getElementById(this.id) as HTMLElement
    if (!container || !window.ResizeObserver) return

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
      this.resizeTimeout = window.setTimeout(() => {
        if (this.myChart) {
          this.myChart.resize()
          this.updateChart()
        }
      }, 100)
    })

    this.resizeObserver.observe(container)
  }

  private cleanup(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.myChart) this.myChart.dispose()
  }

  private debounce(func: () => void, wait: number) {
    let timeout: number | null = null
    return () => {
      if (timeout) clearTimeout(timeout)
      timeout = window.setTimeout(func, wait)
    }
  }
}
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  height: 100%;
  min-width: 200px;
  min-height: 150px;
  max-width: 100%;
  max-height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.no-data-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-light);
  font-size: 12px;
  pointer-events: none;
  z-index: 10;

  i {
    font-size: 20px;
    opacity: 0.7;
  }
}
</style>
