<template>
  <div ref="container" class="big-stat-panel">
    <template v-if="hasData">
      <div class="value-overlay">
        <div class="big-value" :style="{ fontSize: valueFontSize, color: displayColor }">
          <span>{{ displayValue }}</span
          ><span v-if="unit" class="value-unit" :style="{ fontSize: unitFontSize }">{{ unit }}</span>
        </div>
      </div>
      <div :id="id" class="chart-container"></div>
    </template>
    <div v-else class="no-data-background">{{ $t('common.noData') }}</div>
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
            width: 1.5,
          },
          areaStyle: {
            // ECharts multiplies the area by an opacity default of 0.7; pin it
            // to 1 so the 18% -> 0% gradient is what renders.
            opacity: 1,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${this.displayColor}2E` },
                { offset: 1, color: `${this.displayColor}00` },
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
      this.myChart = echarts.init(chartDom)
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
      // The value font depends on the size even before the sparkline exists
      this.updateSizes()
      if (this.myChart) {
        this.myChart.resize()
        this.updateChart()
      }
    }, 150)
  }

  private containerWidth = 0
  private containerHeight = 0

  // Value text sizing (Grafana Stat style): the font is driven by the card box
  // only, so cards of the same size always show the same font size. One line of
  // digits is roughly charWidthRatio x font wide; the unit renders at 0.45x.
  private readonly minValueFontPx = 24
  private readonly maxValueFontPx = 44
  private readonly minReadableFontPx = 20
  private readonly unitFontRatio = 0.45
  private readonly charWidthRatio = 0.56
  private readonly valueSidePadding = 16

  /**
   * Full value with thousands separators and the configured decimals. The full
   * number is kept unless it cannot fit at the minimum readable size, in which
   * case it is abbreviated (1.2k / 3.4M).
   */
  private get displayValue(): string {
    if (this.internalValue === null) return '0'
    const full = this.formatFull(this.internalValue)
    // Not measured yet: never guess, show the precise value.
    if (this.containerWidth <= 0 || this.containerHeight <= 0) return full
    return this.fitValueFontPx(full) >= this.minReadableFontPx ? full : this.formatAbbreviated(this.internalValue)
  }

  /** Font size from the card box alone: clamp(24, min(height x 0.2, width x 0.16), 44). */
  private get boxValueFontPx(): number {
    const byHeight = this.containerHeight * 0.2
    const byWidth = this.containerWidth * 0.16
    return Math.min(this.maxValueFontPx, Math.max(this.minValueFontPx, Math.min(byHeight, byWidth)))
  }

  /** Estimated width of `value` + unit at the given value font size. */
  private textWidthPx(value: string, fontPx: number): number {
    const unitChars = this.unit ? this.unit.length * this.unitFontRatio : 0
    const gap = this.unit ? 4 : 0
    return fontPx * this.charWidthRatio * (value.length + unitChars) + gap
  }

  /** Largest font up to the box size that keeps value + unit inside the card. */
  private fitValueFontPx(value: string): number {
    const available = this.containerWidth - this.valueSidePadding * 2
    if (available <= 0) return this.boxValueFontPx
    let fontPx = this.boxValueFontPx
    // Text width grows linearly with the font size, so one step is exact.
    if (this.textWidthPx(value, fontPx) > available) {
      const unitChars = this.unit ? this.unit.length * this.unitFontRatio : 0
      const gap = this.unit ? 4 : 0
      const weight = Math.max(value.length + unitChars, 1)
      fontPx = Math.max(0, (available - gap) / weight / this.charWidthRatio)
    }
    return fontPx
  }

  private get valueFontPx(): number {
    if (this.containerWidth <= 0 || this.containerHeight <= 0) return this.maxValueFontPx
    const fitted = this.fitValueFontPx(this.displayValue)
    return Math.round(Math.max(this.minReadableFontPx, Math.min(this.maxValueFontPx, fitted)))
  }

  private get valueFontSize(): string {
    return `${this.valueFontPx}px`
  }

  private get unitFontSize(): string {
    return `${Math.round(this.valueFontPx * this.unitFontRatio)}px`
  }

  private formatFull(value: number): string {
    const digits = Math.max(0, Math.min(6, this.decimals))
    return value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  private formatAbbreviated(value: number): string {
    const abs = Math.abs(value)
    if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`
    return this.formatFull(value)
  }

  private updateSizes() {
    const container = this.$refs.container as HTMLElement
    if (!container) return

    this.containerWidth = container.clientWidth
    this.containerHeight = container.clientHeight
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
  width: 100%;
  height: 100%;
  min-width: 120px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  background: transparent;
  box-sizing: border-box;
}

.value-overlay {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.big-value {
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.01em;
  text-align: center;
  white-space: nowrap;
}

/* Inline with the value so the two share a baseline. */
.value-unit {
  margin-left: 4px;
  font-weight: 400;
  color: var(--color-text-light);
}

/*
 * Full-bleed sparkline: flush with the card's left, right and bottom edges and
 * clipped by the card's rounded corners.
 */
.chart-container {
  flex: 0 0 32%;
  min-height: 22px;
  width: 100%;
}

.no-data-background {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  font-size: 12px;
}
</style>
