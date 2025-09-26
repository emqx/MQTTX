<template>
  <div class="line-chart-container">
    <div v-if="hasData" :id="id" style="width: 100%; height: 100%"></div>
    <div v-else class="no-data">No Data</div>
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
  @Prop({ default: () => [] }) public chartData!: Array<{ date: string; value: number }>
  @Prop({ default: true }) public smooth!: boolean
  @Prop({ default: true }) public area!: boolean

  private myChart: echarts.ECharts | null = null
  private resizeObserver: ResizeObserver | null = null
  private resizeTimeout: number | null = null
  private debouncedUpdate!: () => void

  @Getter('currentTheme') private theme!: Theme

  get hasData(): boolean {
    return this.chartData.length > 0
  }

  @Watch('theme')
  @Watch('chartData', { deep: true })
  @Watch('color')
  @Watch('smooth')
  @Watch('area')
  onDataChange() {
    this.debouncedUpdate()
  }

  mounted(): void {
    this.debouncedUpdate = this.debounce(this.updateChart, 100)
    this.$nextTick(() => {
      if (this.hasData) {
        this.initChart()
      }
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

    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#424242' : '#e8eaed'
    const gridColor = isLightTheme ? '#e8e8e8' : '#3a3a3a'
    const data = this.chartData

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isLightTheme ? 'rgba(255,255,255,0.95)' : 'rgba(32,33,36,0.95)',
        borderColor: isLightTheme ? '#e0e0e0' : '#424242',
        textStyle: { color: textColor },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((item) => item.date),
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: textColor, fontSize: 10 },
        axisTick: { show: false },
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
          data: data.map((item) => item.value),
          lineStyle: { color: this.color, width: 2 },
          areaStyle: this.area
            ? {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: `${this.color}80` },
                  { offset: 1, color: `${this.color}00` },
                ]),
              }
            : undefined,
        },
      ],
    }

    this.myChart.setOption(option, true)
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
</style>
