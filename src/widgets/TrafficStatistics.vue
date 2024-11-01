<template>
  <el-row class="traffic-statistics-view" :gutter="12">
    <el-col :span="12">
      <number-card class="received" :value="formatBytes(received)" :label="nameConfig.received" icon="el-icon-bottom" />
    </el-col>
    <el-col :span="12">
      <number-card class="sent" :value="formatBytes(sent)" :label="nameConfig.sent" icon="el-icon-top" />
    </el-col>
    <el-col class="chart mt-3" :span="24">
      <el-card shadow="never">
        <line-chart-extent
          :id="`${chartId}-traffic-statistics-chart`"
          :type="chartType"
          :chartData="chartData"
          :formatter="formatBytes"
          height="380px"
        />
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import LineChartExtent from '@/components/charts/LineChartExtent.vue'
import { formatBytes } from '@/utils/formatter'
import NumberCard from '@/components/charts/NumberCard.vue'

@Component({
  components: {
    LineChartExtent,
    NumberCard,
  },
})
export default class TrafficStatistics extends Vue {
  @Prop({ required: true }) public chartId!: string
  @Prop({ required: true }) public nameConfig!: {
    received: string
    sent: string
  }
  @Prop({ default: '' }) public label!: string
  @Prop({ default: 0 }) public received!: number
  @Prop({ default: 0 }) public sent!: number
  @Prop({ default: 'area' }) public chartType!: string
  @Prop({ default: '' }) public unit!: string

  private chartData: AreaLineSeriesData = {
    xData: [],
    seriesData: [
      {
        name: this.nameConfig.received,
        areaStyle: {
          colorFrom: '#80ffa5d9',
          colorTo: '#01bfeccc',
        },
        data: [],
      },
      {
        name: this.nameConfig.sent,
        areaStyle: {
          colorFrom: '#00ddffd9',
          colorTo: '#4d77ffcc',
        },
        data: [],
      },
    ],
  }

  private formatBytes(bytes: number): string {
    const formattedValue = formatBytes(bytes)
    if (this.unit) return `${formattedValue}${this.unit}`
    return formattedValue
  }

  public updateChart() {
    if (this.chartData.xData.length >= 100) {
      this.chartData.xData.shift()
      this.chartData.seriesData[0].data.shift()
      this.chartData.seriesData[1].data.shift()
    }

    this.chartData.xData.push(this.label)
    this.chartData.seriesData[0].data.push(this.received)
    this.chartData.seriesData[1].data.push(this.sent)
  }

  public resetChart() {
    this.chartData.xData = []
    this.chartData.seriesData[0].data = []
    this.chartData.seriesData[1].data = []
  }

  public setDefaultChartData(metrics: MetricsModel[] = []) {
    this.chartData.xData = metrics.map((m) => m.label)
    this.chartData.seriesData[0].data = metrics.map((m) => m.received)
    this.chartData.seriesData[1].data = metrics.map((m) => m.sent)
  }
}
</script>

<style lang="scss" scoped>
.traffic-statistics-view {
  .number-card {
    &.received {
      background: linear-gradient(135deg, #80ffa5d9, #01bfeccc);
    }
    &.sent {
      background: linear-gradient(135deg, #00ddffd9, #4d77ffcc);
    }
  }
}
</style>
