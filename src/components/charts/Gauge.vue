<template>
  <div class="gauge-container">
    <div v-if="hasData" :id="id" style="width: 100%; height: 100%"></div>
    <div v-else class="no-data">{{ $t('common.noData') }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as echarts from 'echarts/core'
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components'
import { GaugeChart as EChartsGaugeChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TitleComponent, TooltipComponent, GridComponent, EChartsGaugeChart, CanvasRenderer, UniversalTransition])

@Component
export default class GaugeChart extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: () => ({ value: null }) }) public data!: GaugeData
  @Prop({ default: 'Temperature' }) public title!: string
  @Prop({ default: '°C' }) public unit!: string
  @Prop({ default: '#00B572' }) public color!: string
  @Prop({ default: undefined }) public min!: number | undefined
  @Prop({ default: undefined }) public max!: number | undefined
  @Prop({ default: 1 }) public decimals!: number
  @Prop({ default: '' }) public valueField!: string

  // Add thresholds
  @Prop({ default: 'Absolute' }) public thresholdsType!: 'Absolute' | 'Percentage'
  @Prop({ default: () => [] }) public thresholds!: Threshold[]

  private myChart: echarts.ECharts | null = null
  private resizeObserver: ResizeObserver | null = null
  private resizeTimeout: number | null = null

  // Dynamic min/max tracking
  private dynamicMin: number | null = null
  private dynamicMax: number | null = null

  @Getter('currentTheme') private theme!: Theme

  private get hasData(): boolean {
    return this.data.value !== null
  }

  private get effectiveMin(): number {
    if (this.min !== undefined) return this.min
    if (this.dynamicMin !== null) return this.dynamicMin
    return 0
  }

  private get effectiveMax(): number {
    if (this.max !== undefined) return this.max
    if (this.dynamicMax !== null) return this.dynamicMax
    return 100
  }

  @Watch('hasData')
  onHasDataChanged(newVal: boolean) {
    if (newVal && !this.myChart) {
      this.updateDynamicMinMax()
      this.$nextTick(() => this.initChart())
    } else if (!newVal && this.myChart) {
      this.resetDynamicMinMax()
      this.myChart.dispose()
      this.myChart = null
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
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

  // Add watch for thresholds and value to update color
  @Watch('thresholds', { deep: true })
  @Watch('thresholdsType')
  @Watch('data.value')
  onThresholdOrValueChange() {
    this.updateDynamicMinMax()
    this.updateChart()
  }

  private updateDynamicMinMax(): void {
    if (this.data.value === null) return

    if (this.min === undefined) {
      if (this.dynamicMin === null || this.data.value < this.dynamicMin) {
        this.dynamicMin = this.data.value
      }
    }

    if (this.max === undefined) {
      if (this.dynamicMax === null || this.data.value > this.dynamicMax) {
        this.dynamicMax = this.data.value
      }
    }
  }

  public resetDynamicMinMax(): void {
    this.dynamicMin = null
    this.dynamicMax = null
  }

  private get displayColor(): string {
    if (this.data.value == null || this.thresholds.length === 0) return this.color

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
      if (this.data.value >= t.absValue) {
        selectedColor = t.color
      } else {
        break
      }
    }
    return selectedColor
  }

  // Add computed for outerColors
  private get outerColors(): Array<[number, string]> {
    if (this.thresholds.length === 0) {
      return [[1, this.theme === 'light' ? '#ddd' : '#555']]
    }
    const range = this.effectiveMax - this.effectiveMin
    const sortedThresholds = [...this.thresholds]
      .map((t) => ({
        frac: this.thresholdsType === 'Percentage' ? t.value / 100 : (t.value - this.effectiveMin) / range,
        color: t.color,
      }))
      .sort((a, b) => a.frac - b.frac)

    let prevFrac = 0
    let prevColor = this.color // Base color for below first threshold

    const colors: Array<[number, string]> = []
    for (const t of sortedThresholds) {
      if (t.frac > prevFrac) {
        colors.push([t.frac, prevColor])
      }
      prevFrac = t.frac
      prevColor = t.color
    }
    if (prevFrac < 1) {
      colors.push([1, prevColor])
    }
    return colors
  }

  private getChartOption(): echarts.EChartsCoreOption {
    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#424242' : '#e8eaed'

    // Get container size
    const container = document.getElementById(this.id) as HTMLElement
    const width = container?.clientWidth || 200
    const height = container?.clientHeight || 200
    const size = Math.min(width, height)

    // Compute responsive font sizes
    const titleFontSize = Math.max(10, Math.min(16, size / 20))
    const detailFontSize = Math.max(14, Math.min(32, size / 8))
    const detailOffset = size > 200 ? '10%' : '15%'
    const titleOffset = size > 200 ? '-30%' : '-25%'

    // Make the axis and progress bar thicker
    const axisWidth = Math.max(16, size / 12) // was 24, scales with size
    const progressWidth = Math.max(16, size / 12) // was 24

    return {
      backgroundColor: 'transparent',
      series: [
        // Outer static thin ring with threshold colors
        {
          type: 'gauge',
          center: ['50%', '60%'],
          radius: '82%', // Slightly larger than main
          startAngle: 200,
          endAngle: -20,
          min: this.effectiveMin,
          max: this.effectiveMax,
          axisLine: {
            lineStyle: {
              width: 2,
              color: this.outerColors,
              shadowBlur: 0,
            },
          },
          progress: { show: false },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { show: false },
          data: [{ value: this.effectiveMax }],
        },
        // Main gauge
        {
          type: 'gauge',
          center: ['50%', '60%'],
          radius: '75%', // Inner
          startAngle: 200,
          endAngle: -20,
          min: this.effectiveMin,
          max: this.effectiveMax,
          splitNumber: 0,
          itemStyle: {
            // Use displayColor
            color: this.displayColor,
            shadowColor: `${this.displayColor}40`,
            shadowBlur: 8,
          },
          progress: {
            show: true,
            width: progressWidth,
            roundCap: false,
            itemStyle: {
              // Use displayColor
              color: this.displayColor,
              shadowColor: `${this.displayColor}40`,
              shadowBlur: 4,
            },
          },
          pointer: { show: false },
          axisLine: {
            lineStyle: {
              width: axisWidth,
              color: [[1, isLightTheme ? '#e8e8e8' : '#3a3a3a']],
              cap: 'round',
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          title: {
            show: true,
            offsetCenter: [0, titleOffset],
            fontSize: titleFontSize,
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: isLightTheme ? '#666666' : '#a0a0a0',
          },
          detail: {
            valueAnimation: true,
            width: '70%',
            lineHeight: 20,
            borderRadius: 4,
            offsetCenter: [0, detailOffset],
            fontSize: detailFontSize,
            fontWeight: '600',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            formatter: (value: number) => {
              const mainValue = `${value.toFixed(this.decimals)}${this.unit}`
              if (this.valueField && this.valueField.trim() !== '') {
                return `${mainValue}\n{valueField|${this.valueField}}`
              }
              return mainValue
            },
            color: textColor,
            backgroundColor: 'transparent',
            padding: [4, 8],
            rich: {
              valueField: {
                fontSize: Math.max(10, Math.min(16, size / 18)),
                fontWeight: '400',
                color: isLightTheme ? '#888' : '#aaa',
                lineHeight: 18,
              },
            },
          },
          data: [
            {
              value: this.data.value,
            },
          ],
        },
      ],
    }
  }

  mounted(): void {
    this.$nextTick(() => {
      if (this.hasData) {
        this.updateDynamicMinMax()
        this.initChart()
      }
    })
  }

  beforeDestroy(): void {
    this.cleanup()
  }

  private initChart(): void {
    const chartDom = document.getElementById(this.id) as HTMLElement
    if (chartDom) {
      this.myChart = echarts.init(chartDom, this.theme !== 'light' ? 'dark' : null)
      this.setupResizeObserver() // Moved here
      this.updateChart()
    }
  }

  private updateChart(): void {
    if (this.myChart) {
      this.myChart.setOption(this.getChartOption(), true)
    }
  }

  private setupResizeObserver(): void {
    const container = document.getElementById(this.id) as HTMLElement
    if (!container || !window.ResizeObserver) return

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
      }
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
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.myChart) {
      this.myChart.dispose()
      this.myChart = null
    }
  }

  public updateValue(value: number): void {
    if (this.myChart && value >= this.effectiveMin && value <= this.effectiveMax && this.data.value !== null) {
      this.myChart.setOption({
        series: [{ data: [{ value }] }],
      })
    }
  }
}
</script>

<style scoped>
.gauge-container {
  width: 100%;
  height: 100%;
  min-width: 150px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.no-data {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}

/* Responsive behavior - let CSS handle the sizing */
@media (max-width: 300px) {
  .gauge-container {
    min-width: 120px;
    min-height: 120px;
  }
}

@media (min-width: 400px) {
  .gauge-container {
    min-width: 180px;
    min-height: 180px;
  }
}
</style>
