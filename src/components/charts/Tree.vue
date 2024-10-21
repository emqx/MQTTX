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
  @Prop({ required: true }) public data!: TopicTreeNode[]
  @Prop({ default: 'vertical' }) public layout!: 'horizontal' | 'vertical'
  @Prop({ default: 7 }) public symbolSize!: number
  @Prop({ default: 'transparent' }) public backgroundColor!: string
  @Prop({ default: () => ({}) }) public tooltipFormatter!: (params: any) => string | Record<string, any>

  @Getter('currentTheme') private theme!: string

  private chart: echarts.ECharts | null = null

  @Watch('data', { deep: true })
  @Watch('layout')
  @Watch('symbolSize')
  private onDataChanged() {
    this.updateChart()
  }

  private generateChartOption(): any {
    const treeData = this.data
    console.log(treeData)
    return {
      backgroundColor: this.backgroundColor,
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: this.tooltipFormatter,
      },
      legend: {
        data: treeData.map((tree) => ({
          name: tree.label,
          icon: 'rectangle',
        })),
      },
      series: treeData.map((tree) => ({
        type: 'tree',
        data: [tree],
        symbolSize: this.symbolSize,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        emphasis: {
          focus: 'descendant',
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
      })),
    }
  }

  private initChart() {
    const chartDom = document.getElementById(this.id)
    if (!chartDom) return

    this.chart = echarts.init(chartDom, this.theme !== 'light' ? 'dark' : 'light')
    this.updateChart()
  }

  private updateChart() {
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
