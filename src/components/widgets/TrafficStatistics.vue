<template>
  <el-row class="traffic-statistics-view" :gutter="12">
    <el-col :span="12">
      <el-card class="info-card received" shadow="never">
        <div class="value">{{ formatBytes(received) }} <i class="el-icon-bottom ml-2"></i></div>
        <div class="label">{{ $t('viewer.accumulatedReceivedTraffic') }}</div>
      </el-card>
    </el-col>
    <el-col :span="12">
      <el-card class="info-card sent" shadow="never">
        <div class="value">{{ formatBytes(sent) }} <i class="el-icon-top ml-2"></i></div>
        <div class="label">{{ $t('viewer.accumulatedSentTraffic') }}</div>
      </el-card>
    </el-col>
    <el-col class="chart mt-3" :span="24">
      <el-card shadow="never">
        <area-line id="bytesChart" :chartData="chartData" :formatter="formatBytes" height="380px" />
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import AreaLine from '@/components/charts/AreaLine.vue'
import { formatBytes } from '@/utils/formatter'

@Component({
  components: {
    AreaLine,
  },
})
export default class TrafficStatistics extends Vue {
  @Prop({ default: '' }) public label!: string
  @Prop({ default: 0 }) public received!: number
  @Prop({ default: 0 }) public sent!: number

  @Getter('currentTheme') private theme!: Theme

  private chartData: AreaLineSeriesData = {
    xData: [],
    seriesData: [
      {
        name: this.$tc('viewer.accumulatedReceivedTraffic'),
        areaStyle: {
          colorFrom: 'rgb(128, 255, 165)',
          colorTo: 'rgb(1, 191, 236)',
        },
        data: [],
      },
      {
        name: this.$tc('viewer.accumulatedSentTraffic'),
        areaStyle: {
          colorFrom: 'rgb(0, 221, 255)',
          colorTo: 'rgb(77, 119, 255)',
        },
        data: [],
      },
    ],
  }

  private formatBytes(bytes: number): string {
    return formatBytes(bytes)
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
}
</script>

<style lang="scss" scoped>
.traffic-statistics-view {
  .info-card {
    padding: 20px;
    text-align: center;
    border: 0px;
    &.received {
      background: linear-gradient(135deg, rgba(128, 255, 165, 0.85), rgba(1, 191, 236, 0.8));
    }

    &.sent {
      background: linear-gradient(135deg, rgba(0, 221, 255, 0.85), rgba(77, 119, 255, 0.8));
    }

    .value {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }

    .label {
      margin-top: 8px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .chart {
    margin-top: 20px;
  }
}
</style>
