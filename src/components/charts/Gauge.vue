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
import { attachChartResize, getChartThemeColors } from '@/utils/chartTheme'

echarts.use([TitleComponent, TooltipComponent, GridComponent, EChartsGaugeChart, CanvasRenderer, UniversalTransition])

@Component
export default class GaugeChart extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: () => ({ value: null }) }) public data!: GaugeData
  @Prop({ default: '°C' }) public unit!: string
  @Prop({ default: '#00B572' }) public color!: string
  @Prop({ default: undefined }) public min!: number | undefined
  @Prop({ default: undefined }) public max!: number | undefined
  @Prop({ default: 1 }) public decimals!: number

  // Add thresholds
  @Prop({ default: 'Absolute' }) public thresholdsType!: 'Absolute' | 'Percentage'
  @Prop({ default: () => [] }) public thresholds!: Threshold[]

  private myChart: echarts.ECharts | null = null
  private detachResize: (() => void) | null = null

  // Dynamic min/max tracking
  private dynamicMin: number | null = null
  private dynamicMax: number | null = null

  // Shrunk to the ring's inner opening so the value stays off the band.
  private readonly minValueFontPx = 24
  private readonly maxValueFontPx = 44
  private readonly minReadableFontPx = 20
  private readonly unitFontRatio = 0.45
  private readonly charWidthRatio = 0.56

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
      this.detachResize?.()
      this.detachResize = null
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
      return [[1, getChartThemeColors().splitLine]]
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
    const colors = getChartThemeColors()

    // Get container size
    const container = document.getElementById(this.id) as HTMLElement
    const width = container?.clientWidth || 200
    const height = container?.clientHeight || 200
    const size = Math.min(width, height)

    // Same rule as the value, shrunk further to fit the ring; unit at 0.45x.
    const valueText = this.data.value === null ? '0' : this.data.value.toFixed(this.decimals)
    const unitChars = this.unit ? this.unit.length * this.unitFontRatio : 0
    const weight = Math.max(valueText.length + unitChars, 1)
    const boxFontPx = Math.min(this.maxValueFontPx, Math.max(this.minValueFontPx, Math.min(height * 0.2, width * 0.16)))

    // Band inward from the ring, so the free opening shrinks by twice the band.
    const bandWidth = Math.max(16, size / 12)
    const innerDiameter = 2 * (0.375 * size - bandWidth)

    const detailFontSize = Math.round(
      Math.max(this.minReadableFontPx, Math.min(boxFontPx, (innerDiameter * 0.78) / weight / this.charWidthRatio)),
    )
    const unitFontSize = Math.round(detailFontSize * this.unitFontRatio)
    const detailOffset = size > 200 ? '10%' : '15%'

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
          },
          progress: {
            show: true,
            width: bandWidth,
            roundCap: true,
            itemStyle: {
              // Use displayColor
              color: this.displayColor,
            },
          },
          pointer: { show: false },
          axisLine: {
            lineStyle: {
              width: bandWidth,
              color: [[1, colors.splitLine]],
              cap: 'round',
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          // The card header already shows the widget title, so the ring no
          // longer repeats it (same as the Big Number card).
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            width: '70%',
            lineHeight: 20,
            borderRadius: 4,
            offsetCenter: [0, detailOffset],
            fontSize: detailFontSize,
            fontWeight: '600',
            formatter: (value: number) =>
              this.unit ? `${value.toFixed(this.decimals)}{unit|${this.unit}}` : value.toFixed(this.decimals),
            color: colors.title,
            backgroundColor: 'transparent',
            padding: [4, 8],
            rich: {
              unit: {
                fontSize: unitFontSize,
                fontWeight: '400',
                color: colors.subText,
                padding: [0, 0, 0, 4],
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
      this.myChart = echarts.init(chartDom)
      // A theme change re-inits the chart, so replace the old observer.
      this.detachResize?.()
      this.detachResize = attachChartResize(chartDom, this.handleResize)
      this.updateChart()
    }
  }

  private updateChart(): void {
    if (this.myChart) {
      this.myChart.setOption(this.getChartOption(), true)
    }
  }

  // The value font is derived from the container box, so redraw, not just resize.
  private handleResize(): void {
    if (this.myChart) {
      this.myChart.resize()
      this.updateChart()
    }
  }

  private cleanup(): void {
    if (this.detachResize) {
      this.detachResize()
      this.detachResize = null
    }

    if (this.myChart) {
      this.myChart.dispose()
      this.myChart = null
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
  color: var(--color-text-light);
  font-size: 13px;
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
