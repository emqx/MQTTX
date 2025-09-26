<template>
  <div
    ref="container"
    :style="{ width: '100%', height: '100%', minWidth: '120px', minHeight: '80px', position: 'relative' }"
    class="big-stat-panel"
  >
    <div v-if="internalChartData.length > 0" :id="id" class="chart-container"></div>
    <div v-else class="no-data-background">No Data</div>

    <!-- Value Overlay -->
    <div class="value-overlay">
      <template v-if="internalValue != null">
        <div class="big-value" :style="{ fontSize: bigFontSize, color: displayColor }">
          {{ formatValue(internalValue) }}
        </div>
        <div class="value-unit" v-if="unit" :style="{ fontSize: unitFontSize }">{{ unit }}</div>
      </template>
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
import { Threshold } from '@/types/widgets'

echarts.use([TitleComponent, TooltipComponent, GridComponent, EChartsLineChart, CanvasRenderer, UniversalTransition])

@Component
export default class BigNumberChart extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: null }) public value!: number | null
  @Prop({ default: '' }) public unit!: string
  @Prop({ default: '#00B572' }) public color!: string
  @Prop({ default: undefined }) public min!: number | undefined
  @Prop({ default: undefined }) public max!: number | undefined
  @Prop({ default: () => [] }) public chartData!: Array<{ date: string; value: number }>
  @Prop({ default: 1 }) public decimals!: number

  @Prop({ default: 'Absolute' }) public thresholdsType!: 'Absolute' | 'Percentage'
  @Prop({ default: () => [] }) public thresholds!: Threshold[]

  private myChart: echarts.ECharts | null = null
  private resizeObserver: ResizeObserver | null = null
  private resizeTimeout: number | null = null

  @Getter('currentTheme') private theme!: Theme

  @Watch('theme')
  onThemeChanged() {
    this.updateChart()
  }

  @Watch('value')
  @Watch('min')
  @Watch('max')
  @Watch('thresholds', { deep: true })
  @Watch('thresholdsType')
  @Watch('chartData', { deep: true })
  onDataChange() {
    this.updateChart()
  }

  private get internalChartData() {
    return this.chartData
  }

  private get internalValue(): number | null {
    return this.value
  }

  private get effectiveMin(): number {
    if (this.min !== undefined) return this.min
    return this.chartData.length > 0 ? Math.min(...this.chartData.map((d) => d.value)) : 0
  }

  private get effectiveMax(): number {
    if (this.max !== undefined) return this.max
    return this.chartData.length > 0 ? Math.max(...this.chartData.map((d) => d.value)) : 100
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

    const data = this.internalChartData

    return {
      animation: false,
      backgroundColor: 'transparent',
      grid: {
        left: '0%',
        right: '0%',
        top: '0%',
        bottom: '0%',
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(32, 33, 36, 0.95)',
        borderColor: isLightTheme ? '#e0e0e0' : '#424242',
        textStyle: {
          color: textColor,
          fontSize: 11,
        },
        formatter: (params: any) => {
          const dataPoint = params[0]
          return `${dataPoint.axisValue}<br/>${dataPoint.value}${this.unit}`
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.date),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        show: false,
        min: this.min !== undefined ? this.min : 'dataMin',
        max: this.max !== undefined ? this.max : 'dataMax',
      },
      series: [
        {
          animation: false,
          type: 'line',
          data: data.map((item) => item.value),
          smooth: false,
          symbol: 'none',
          lineStyle: {
            color: this.displayColor,
            width: 2,
            opacity: 0.9,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${this.displayColor}30` },
                { offset: 1, color: `${this.displayColor}05` },
              ],
            },
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    }
  }

  mounted(): void {
    this.$nextTick(() => {
      this.initChart()
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
    }
  }

  private updateChart(): void {
    if (this.myChart) {
      const option = this.getResponsiveOption()
      this.myChart.setOption(option, true)
    }
  }

  private setupResizeObserver(): void {
    const container = document.getElementById(this.id) as HTMLElement
    if (!container || !window.ResizeObserver) return

    this.resizeObserver = new ResizeObserver(() => {
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
    })

    this.resizeObserver.observe(container)
  }

  private bigFontSize: string = '72px'
  private unitFontSize: string = '14px'

  private formatValue(value: number): string {
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

    this.bigFontSize = `${Math.max(32, Math.min(96, size / 3.5))}px`
    this.unitFontSize = `${Math.max(10, Math.min(16, size / 18))}px`
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
}

.value-unit {
  font-size: 14px;
  font-weight: 400;
  color: #8c8c8c;
  font-family: 'system-ui', -apple-system, sans-serif;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 3;
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
</style>
