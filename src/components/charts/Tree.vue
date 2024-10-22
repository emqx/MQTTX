<template>
  <div :id="id" :style="{ width, height }"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as echarts from 'echarts/core'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { TreeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TooltipComponent, LegendComponent, TreeChart, CanvasRenderer])

@Component
export default class TreeChartComponent extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: '400px' }) public height!: string
  @Prop({ default: '100%' }) public width!: string
  @Prop({ required: true }) public data!: EChartsTreeNode
  @Prop({ default: 8 }) public symbolSize!: number
  @Prop({ default: 'transparent' }) public backgroundColor!: string
  @Prop({ default: () => ({}) }) public tooltipFormatter!: (params: any) => string | Record<string, any>
  @Prop({ default: 4 }) public defaultExpandLevel!: number

  @Getter('currentTheme') private theme!: string

  private chart: echarts.ECharts | null = null

  @Watch('data', { deep: true })
  private onDataChanged() {
    this.updateChart()
  }

  @Watch('defaultExpandLevel')
  private onDefaultExpandLevelChanged() {
    this.updateChart()
  }

  private generateChartOption() {
    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#616161' : '#e6e8f1'
    const backgroundColor = isLightTheme ? '#fff' : this.theme === 'dark' ? '#262729' : '#292b33'

    return {
      backgroundColor: this.backgroundColor,
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: this.tooltipFormatter,
      },
      series: [
        {
          type: 'tree',
          data: [this.data],
          symbolSize: this.symbolSize,
          initialTreeDepth: this.defaultExpandLevel,
          itemStyle: {
            color: '#53daa2',
            borderColor: '#53daa2',
          },
          label: {
            color: textColor,
            position: 'left',
            verticalAlign: 'middle',
            align: 'right',
            backgroundColor,
            padding: [1, 1],
            borderRadius: 3,
            z: 100,
            fontSize: 13,
          },
          leaves: {
            label: {
              position: 'right',
              verticalAlign: 'middle',
              align: 'left',
              color: textColor,
              fontSize: 13,
            },
          },
          emphasis: {
            focus: 'descendant',
            itemStyle: {
              color: '#34c388',
              borderColor: '#34c388',
            },
            label: {
              color: '#53daa2',
            },
          },
          expandAndCollapse: true,
          animationDuration: 550,
          animationDurationUpdate: 750,
          left: '130px',
          right: '130px',
          top: 0,
          bottom: 0,
        },
      ],
    }
  }

  private initChart() {
    const chartDom = document.getElementById(this.id)
    if (!chartDom) return

    this.chart = echarts.init(chartDom, this.theme !== 'light' ? 'dark' : 'light')
    this.updateChart()
  }

  public updateChart() {
    if (this.chart) {
      const option = this.generateChartOption()
      this.chart.setOption(option)
    }
  }

  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  }

  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  }

  private handleResize = () => {
    if (this.chart) {
      this.chart.resize()
    }
  }
}
</script>
