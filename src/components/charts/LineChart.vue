<template>
  <div class="line-chart-container">
    <div :id="id" class="chart-container"></div>
    <div v-if="!hasData" class="no-data-overlay">{{ $t('common.noData') }}</div>
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
      this.myChart = echarts.init(chartDom, this.theme !== 'light' ? 'dark' : null)
      this.debouncedUpdate()
    }
  }

  private updateChart(): void {
    if (!this.myChart) return

    const container = document.getElementById(this.id)
    const containerWidth = container?.clientWidth || 400
    const containerHeight = container?.clientHeight || 300

    const leftMargin = Math.max(containerWidth * 0.07, 20)
    const rightMargin = Math.max(containerWidth * 0.05, 20)
    const bottomMargin = Math.max(containerHeight * 0.15, 20)

    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#424242' : '#e8eaed'
    const gridColor = isLightTheme ? '#e8e8e8' : '#3a3a3a'

    const timeSeriesData = this.getTimeSeriesData()

    if (timeSeriesData.length === 0) {
      const option = {
        animation: false,
        backgroundColor: 'transparent',
        grid: { left: leftMargin, right: rightMargin, bottom: bottomMargin, top: 20 },
        xAxis: { type: 'time', show: false },
        yAxis: { type: 'value', show: false },
        series: [{ type: 'line', data: [] }],
      }
      this.myChart.setOption(option, true, true)
      return
    }

    const option = {
      animation: false, // Disable all animations to prevent visual corruption
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isLightTheme ? 'rgba(255,255,255,0.95)' : 'rgba(32,33,36,0.95)',
        borderColor: isLightTheme ? '#e0e0e0' : '#424242',
        textStyle: { color: textColor },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const data = params[0]
          const time = new Date(data.data[0]).toLocaleString()
          const value = data.data[1]
          return `${time}<br/>Value: ${value}`
        },
      },
      grid: {
        left: leftMargin,
        right: rightMargin,
        bottom: bottomMargin,
        top: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: (value: number) => {
            const date = new Date(value)
            if (this.duration <= 60) {
              // Less than 1 hour - show minutes:seconds
              return date.toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit' })
            } else if (this.duration <= 24 * 60) {
              // Less than 1 day - show hours:minutes
              return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            } else {
              // More than 1 day - show date
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
          },
        },
        axisTick: { show: false },
        min: this.getTimeAxisMin(),
        max: this.getTimeAxisMax(),
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          smooth: this.smooth,
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

  private debounce(func: Function, wait: number) {
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 16px;
  pointer-events: none;
  z-index: 10;
}
</style>
