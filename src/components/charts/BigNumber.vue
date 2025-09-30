<template>
  <div
    ref="container"
    :style="{ width: '100%', height: '100%', minWidth: '120px', minHeight: '80px', position: 'relative' }"
    class="big-stat-panel"
  >
    <div v-if="hasData" :id="id" class="chart-container"></div>
    <div v-else class="no-data-background">No Data</div>

    <!-- Value Overlay -->
    <div v-if="hasData" class="value-overlay">
      <div class="big-value" :style="{ fontSize: bigFontSize, color: displayColor }">
        {{ formatValue(internalValue) }}
      </div>
      <div class="value-unit" v-if="unit" :style="{ fontSize: unitFontSize }">{{ unit }}</div>
      <div class="extracted-field" v-if="extractedFieldName" :style="{ fontSize: fieldFontSize }">
        {{ extractedFieldName }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as echarts from 'echarts/core'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { LineChart as EChartsLineChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TitleComponent, TooltipComponent, GridComponent, EChartsLineChart, CanvasRenderer, UniversalTransition])

@Component
export default class BigNumberChart extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: '' }) public unit!: string
  @Prop({ default: '#00B572' }) public color!: string
  @Prop({ default: undefined }) public min!: number | undefined
  @Prop({ default: undefined }) public max!: number | undefined
  @Prop({ default: 1 }) public decimals!: number
  @Prop({ default: () => ({ value: null, chartData: { xData: [], seriesData: [] } }) }) public data!: BigNumberData
  @Prop({ default: 'Absolute' }) public thresholdsType!: 'Absolute' | 'Percentage'
  @Prop({ default: () => [] }) public thresholds!: Threshold[]
  @Prop({ default: '' }) public extractedFieldName!: string
  @Prop({ default: 24 * 60 }) public duration!: number // Duration in minutes
  @Prop({ default: 'static' }) public timeRangeType!: 'live' | 'static'

  private myChart: echarts.ECharts | null = null
  private resizeObserver: ResizeObserver | null = null
  private resizeTimeout: number | null = null

  @Getter('currentTheme') private theme!: Theme

  get hasData(): boolean {
    return this.data.value !== null
  }

  private getTimeAxisMin(): number {
    if (this.timeRangeType === 'live') {
      const now = new Date().getTime()
      return now - 1 * 60 * 1000 // Always show 1 minute window
    }
    return undefined as any // Let ECharts auto-determine for static ranges
  }

  private getTimeAxisMax(): number {
    if (this.timeRangeType === 'live') {
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

    // If we're in live mode, filter out points outside the 1-minute window
    if (this.timeRangeType === 'live') {
      const now = new Date().getTime()
      const cutoffTime = now - 1 * 60 * 1000 // Always use 1 minute window
      return timeSeriesData.filter(([timestamp]) => timestamp >= cutoffTime) as Array<[number, number]>
    }

    return timeSeriesData as Array<[number, number]>
  }

  @Watch('hasData')
  onHasDataChanged(newVal: boolean) {
    if (newVal && !this.myChart) {
      this.$nextTick(() => this.initChart())
    } else if (!newVal && this.myChart) {
      this.myChart.dispose()
      this.myChart = null
    }
  }

  @Watch('theme')
  onThemeChanged() {
    if (this.myChart) {
      this.myChart.dispose()
      this.myChart = null
    }
    if (this.hasData) {
      this.initChart()
    }
  }

  @Watch('min')
  @Watch('max')
  @Watch('thresholds', { deep: true })
  @Watch('thresholdsType')
  @Watch('data', { deep: true })
  @Watch('duration')
  @Watch('timeRangeType')
  onDataChange() {
    this.updateChart()
  }

  @Watch('$refs.container')
  onContainerChange() {
    if (this.myChart) {
      this.$nextTick(() => {
        this.myChart?.resize()
        this.updateSizes()
      })
    }
  }

  private get internalChartData() {
    return this.data.chartData
  }

  private get internalValue(): number | null {
    return this.data.value
  }

  private get effectiveMin(): number {
    if (this.min !== undefined) return this.min
    return this.data.chartData.seriesData.length > 0
      ? Math.min(...this.data.chartData.seriesData.map((d) => d.data[0]))
      : 0
  }

  private get effectiveMax(): number {
    if (this.max !== undefined) return this.max
    return this.data.chartData.seriesData.length > 0
      ? Math.max(...this.data.chartData.seriesData.map((d) => d.data[0]))
      : 100
  }

  // Add computed displayColor
  private get displayColor(): string {
    if (this.internalValue == null || this.thresholds.length === 0) return this.color

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
      if (this.internalValue >= t.absValue) {
        selectedColor = t.color
      } else {
        break
      }
    }
    return selectedColor
  }

  private getResponsiveOption(): echarts.EChartsCoreOption {
    const container = document.getElementById(this.id) as HTMLElement
    if (!container) return {}

    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#424242' : '#e8eaed'

    const timeSeriesData = this.getTimeSeriesData()

    // If there's no valid data, show empty chart
    if (timeSeriesData.length === 0) {
      return {
        animation: false,
        backgroundColor: 'transparent',
        grid: { left: '0%', right: '0%', top: '0%', bottom: '0%' },
        xAxis: { type: 'time', show: false },
        yAxis: { type: 'value', show: false },
        series: [{ type: 'line', data: [] }],
      }
    }

    return {
      animation: false, // Disable all animations to prevent visual corruption
      backgroundColor: 'transparent',
      grid: {
        left: '0%',
        right: '0%',
        top: '0%',
        bottom: '0%',
        containLabel: false,
      },
      tooltip: {
        show: false,
      },
      xAxis: {
        type: 'time',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        min: this.getTimeAxisMin(),
        max: this.getTimeAxisMax(),
      },
      yAxis: {
        type: 'value',
        show: false,
        min: this.min !== undefined ? this.min : 'dataMin',
        max: this.max !== undefined ? this.max : 'dataMax',
      },
      series: [
        {
          animation: false, // Disable series animation
          type: 'line',
          data: timeSeriesData, // Use the filtered and sorted data
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: this.displayColor,
            width: 1,
            opacity: 0.6,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${this.displayColor}60` },
                { offset: 1, color: `${this.displayColor}05` },
              ],
            },
          },
          emphasis: {
            disabled: true,
          },
          connectNulls: false, // Don't connect points across gaps
        },
      ],
    }
  }

  mounted(): void {
    this.$nextTick(() => {
      if (this.hasData) {
        this.initChart()
      }
      this.updateSizes()
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
      this.updateChart()
      // Ensure chart is properly sized on initialization
      this.$nextTick(() => {
        if (this.myChart) {
          this.myChart.resize()
        }
      })
    }
  }

  private updateChart(): void {
    if (this.myChart) {
      const option = this.getResponsiveOption()
      this.myChart.setOption(option, true, true) // notMerge: true, lazyUpdate: true
    }
  }

  private setupResizeObserver(): void {
    const container = this.$refs.container as HTMLElement
    if (!container) return

    // Use ResizeObserver if available
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize()
      })
      this.resizeObserver.observe(container)
    } else {
      // Fallback to window resize listener
      window.addEventListener('resize', this.handleResize)
    }
  }

  private handleResize(): void {
    if (this.resizeTimeout !== null) {
      clearTimeout(this.resizeTimeout)
    }
    this.resizeTimeout = window.setTimeout(() => {
      if (this.myChart) {
        this.myChart.resize()
        this.updateChart()
        this.updateSizes()
      }
    }, 150)
  }

  private bigFontSize: string = '96px'
  private unitFontSize: string = '14px'
  private fieldFontSize: string = '12px'

  private formatValue(value: number | null): string {
    if (value === null) return '0'
    const rounded = Number(value.toFixed(this.decimals))
    if (rounded >= 1000000) {
      return (rounded / 1000000).toFixed(1) + 'M'
    } else if (rounded >= 1000) {
      return (rounded / 1000).toFixed(1) + 'k'
    }
    return rounded.toString()
  }

  private updateSizes() {
    const container = this.$refs.container as HTMLElement
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight
    const size = Math.min(width, height)

    this.bigFontSize = `${Math.max(48, Math.min(120, size / 2.5))}px`
    this.unitFontSize = `${Math.max(10, Math.min(16, size / 18))}px`
    this.fieldFontSize = `${Math.max(8, Math.min(14, size / 25))}px`
  }

  // TODO: Remove these dummy data generation methods - for testing purposes only
  private generateDummyChartData(): BigNumberData {
    const data: BigNumberData = {
      value: 0,
      chartData: {
        xData: [],
        seriesData: [
          {
            name: 'value',
            data: [],
          },
        ],
      },
    }
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const value = Math.random() * 100 // Random value between 50-150
      data.chartData.xData.push(date.toISOString().split('T')[0])
      data.chartData.seriesData[0].data.push(Math.round(value * 100) / 100)
    }

    return data
  }

  private generateDummyValue(): number {
    return Math.round((Math.random() * 100 + 50) * 100) / 100 // Random value between 50-150
  }

  private cleanup(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    } else {
      // Remove window resize listener if it was added as fallback
      window.removeEventListener('resize', this.handleResize)
    }

    if (this.myChart) {
      this.myChart.dispose()
      this.myChart = null
    }
  }

  public updateValue(value: number): void {
    // Empty or comment out, as no sample refresh needed
  }
}
</script>

<style scoped>
.big-stat-panel {
  position: relative;
  background: transparent;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
}

.chart-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.value-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2;
  pointer-events: none;
  padding: 12px;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.panel-title {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  margin-bottom: 8px;
  font-family: 'system-ui', -apple-system, sans-serif;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.big-value {
  font-size: 72px;
  font-weight: 600;
  color: #262626;
  font-family: 'system-ui', -apple-system, sans-serif;
  line-height: 1;
  text-align: center;
  margin-bottom: 4px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 3;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.value-unit {
  font-size: 14px;
  font-weight: 400;
  color: #8c8c8c;
  font-family: 'system-ui', -apple-system, sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 3;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.extracted-field {
  font-size: 12px;
  font-weight: 400;
  color: #999;
  font-family: 'system-ui', -apple-system, sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 3;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  opacity: 0.8;
}

.no-data-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  z-index: 1;
}

.no-data {
  font-size: 24px;
  font-weight: 600;
  color: #999;
}

/* Dark theme styles */
:global(.dark) .panel-title {
  color: #b3b3b3;
}

:global(.dark) .big-value {
  color: #f0f0f0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

:global(.dark) .value-unit {
  color: #b3b3b3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

:global(.dark) .extracted-field {
  color: #888;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
