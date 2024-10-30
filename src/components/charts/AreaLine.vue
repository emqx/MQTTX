<template>
  <div :id="id" :style="{ width, height }"></div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as echarts from 'echarts/core'
import { TitleComponent, ToolboxComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
])

@Component
export default class AreaLine extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: '450px' }) public height!: string
  @Prop({ default: '100%' }) public width!: string
  @Prop({ default: 'transparent' }) public backgroundColor!: string
  @Prop({ default: '' }) public chartTitle!: string
  @Prop({ default: null }) public formatter?: (value: number) => string
  @Prop({
    default: () => ({
      xData: [],
      seriesData: [],
    }),
  })
  public chartData!: AreaLineSeriesData

  @Getter('currentTheme') private theme!: Theme

  @Watch('chartData', { deep: true })
  onChartDataChanged(val: any) {
    this.updateChart()
  }

  private areaLineChart: echarts.ECharts | null = null

  private generateChartOption() {
    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#616161' : '#e6e8f1'
    return {
      backgroundColor: this.backgroundColor,
      color: this.chartData.seriesData.map((item) => item.areaStyle.colorFrom),
      title: {
        text: this.chartTitle,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
            formatter: (params: any) => {
              if (params.axisDimension === 'y') {
                return this.formatter ? this.formatter(params.value) : params.value
              }
              return params.value
            },
          },
        },
        formatter: (params: any[]) => {
          let result = `${params[0].axisValue}<br/>`
          params.forEach((param) => {
            const value = this.formatter ? this.formatter(param.value) : param.value
            result += `${param.marker} ${param.seriesName}: ${value}<br/>`
          })
          return result
        },
      },
      legend: {
        data: this.chartData.seriesData.map((item) => item.name),
        textStyle: {
          color: textColor,
        },
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: this.chartData.xData,
        },
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => {
              return this.formatter ? this.formatter(value) : value
            },
          },
        },
      ],
      series: this.chartData.seriesData.map((item) => {
        return {
          name: item.name,
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0,
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: item.areaStyle.colorFrom,
              },
              {
                offset: 1,
                color: item.areaStyle.colorTo,
              },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: item.data,
        }
      }),
    }
  }

  initChart() {
    const chartDom = document.getElementById(this.id) as HTMLElement
    this.areaLineChart = echarts.init(chartDom, this.theme !== 'light' ? 'dark' : 'light')
    this.updateChart()
  }

  updateChart() {
    if (this.areaLineChart) {
      const option = this.generateChartOption()
      this.areaLineChart.setOption(option)
    }
  }

  mounted() {
    this.initChart()
    window.addEventListener('resize', () => {
      if (this.areaLineChart) {
        this.areaLineChart.resize()
      }
    })
  }

  beforeDestroy() {
    if (this.areaLineChart) {
      this.areaLineChart.dispose()
    }
    window.removeEventListener('resize', () => {
      if (this.areaLineChart) {
        this.areaLineChart.resize()
      }
    })
  }
}
</script>
