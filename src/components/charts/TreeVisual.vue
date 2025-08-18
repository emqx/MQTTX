<template>
  <div :id="id" :style="{ width, height }"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as echarts from 'echarts/core'
import { TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { TreeChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TooltipComponent, LegendComponent, DataZoomComponent, TreeChart, CanvasRenderer])

@Component
export default class TreeVisual extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ default: '400px' }) public height!: string
  @Prop({ default: '100%' }) public width!: string
  @Prop({ required: true }) public data!: EChartsTreeNode
  @Prop({ default: 8 }) public symbolSize!: number
  @Prop({ default: 'transparent' }) public backgroundColor!: string
  @Prop({ default: () => ({}) }) public tooltipFormatter!: (params: any) => string | Record<string, any>
  @Prop({ default: 4 }) public defaultExpandLevel!: number
  // Add new props for JSON mode
  @Prop({ default: false }) public isJsonMode!: boolean
  @Prop({ default: false }) public enableZoom!: boolean

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

  @Watch('isJsonMode')
  private onJsonModeChanged() {
    this.updateChart()
  }

  @Watch('enableZoom')
  private onZoomChanged() {
    this.updateChart()
  }

  private generateChartOption() {
    const isLightTheme = this.theme === 'light'
    const textColor = isLightTheme ? '#616161' : '#e6e8f1'
    const backgroundColor = isLightTheme ? '#fff' : this.theme === 'dark' ? '#262729' : '#292b33'

    // Common series configuration
    const baseSeries = {
      type: 'tree',
      data: [this.data],
      symbolSize: this.symbolSize,
      initialTreeDepth: this.defaultExpandLevel,
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750,
    }

    // Base option for regular tree mode
    const baseOption = {
      backgroundColor: this.backgroundColor,
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: this.tooltipFormatter,
        confine: true,
      },
      series: [
        {
          ...baseSeries,
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
          left: '130px',
          right: '130px',
          top: 0,
          bottom: 0,
        },
      ],
    }

    if (this.isJsonMode) {
      return this.addJsonFeatures(baseOption, baseSeries)
    }

    return baseOption
  }

  private addJsonFeatures(baseOption: any, baseSeries: any) {
    const rich = {
      key: { color: '#2563eb', fontWeight: 'bold' },
      string: { color: '#7c3aed' },
      number: { color: '#065f46' },
      boolean: { color: '#0d9488' },
      null: { color: '#6b7280' },
      meta: { color: '#1f2937' },
    }

    const jsonLabelStyle = {
      distance: 8,
      fontFamily: 'monospace',
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      borderRadius: 8,
      padding: [6, 8],
      rich,
      formatter: (params: any) => params.data.name,
    }

    return {
      ...baseOption,
      dataZoom: this.enableZoom
        ? [
            {
              type: 'inside',
              orient: 'horizontal',
              start: 0,
              end: 100,
              zoomLock: false,
            },
            {
              type: 'inside',
              orient: 'vertical',
              start: 0,
              end: 100,
              zoomLock: false,
            },
          ]
        : undefined,
      series: [
        {
          ...baseSeries,
          orient: 'LR',
          roam: true,
          scaleLimit: { min: 0.1, max: 3 },
          lineStyle: { width: 1.5, color: '#94a3b8' },
          edgeShape: 'curve',
          edgeForkPosition: '60%',
          label: {
            ...jsonLabelStyle,
            position: 'left',
            verticalAlign: 'middle',
            align: 'right',
          },
          leaves: {
            label: {
              ...jsonLabelStyle,
              position: 'right',
              verticalAlign: 'middle',
              align: 'left',
            },
          },
          emphasis: {
            focus: 'descendant',
          },
          right: '250px',
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
      this.chart.setOption(option, true)

      // Auto-fit for JSON mode
      if (this.isJsonMode) {
        setTimeout(() => {
          if (this.chart) {
            this.chart.dispatchAction({
              type: 'dataZoom',
              start: 0,
              end: 100,
            })
          }
        }, 100)
      }
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
