<template>
  <my-dialog
    :title="$t('connections.bytesStatistics')"
    :visible.sync="showDialog"
    class="bytes-statistics"
    width="95%"
    top="30px"
    :fullscreen="true"
    @close="resetData"
    @confirm="resetData"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="version-card info-card"> Broker {{ $t('common.version') }}{{ version }} </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="uptime-card info-card"> {{ $t('common.uptime') }}{{ uptime }} </el-card>
      </el-col>
      <el-col class="chart" :span="24">
        <area-line id="bytesChart" :chartData="chartData" />
      </el-col>
    </el-row>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import MyDialog from '@/components/MyDialog.vue'
import AreaLine from '@/components/charts/AreaLine.vue'

@Component({
  components: {
    MyDialog,
    AreaLine,
  },
})
export default class BytesStatistics extends Vue {
  @Prop({ default: false }) public visible!: boolean
  @Prop({ default: '' }) public label!: string
  @Prop({ default: 0 }) public sent!: number
  @Prop({ default: 0 }) public recevied!: number
  @Prop({ default: '' }) public uptime!: ''
  @Prop({ default: '' }) public version!: ''

  @Getter('currentTheme') private theme!: Theme

  private showDialog: boolean = this.visible
  private chartData: AreaLineSeriesData = {
    xData: [],
    seriesData: [
      {
        name: this.$tc('connections.bytesReceived'),
        areaStyle: {
          colorFrom: 'rgb(128, 255, 165)',
          colorTo: 'rgb(1, 191, 236)',
        },
        data: [],
      },
      {
        name: this.$tc('connections.bytesSent'),
        areaStyle: {
          colorFrom: 'rgb(0, 221, 255)',
          colorTo: 'rgb(77, 119, 255)',
        },
        data: [],
      },
    ],
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  public updateChart() {
    if (this.chartData.xData.length >= 20) {
      this.chartData.xData.shift()
      this.chartData.seriesData[0].data.shift()
      this.chartData.seriesData[1].data.shift()
    }

    this.chartData.xData.push(this.label)
    this.chartData.seriesData[0].data.push(this.recevied)
    this.chartData.seriesData[1].data.push(this.sent)
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
  }
}
</script>

<style lang="scss">
.bytes-statistics {
  .el-dialog__body {
    padding-bottom: 0;
  }
  .info-card {
    height: 60px;
    line-height: 60px;
    text-align: center;
    font-size: 16px;
    color: var(--color-text-active);
    .el-card__body {
      padding: 0px;
    }
    &.version-card {
      background: linear-gradient(0.25turn, #0c7cd1, #19bcc2);
    }
    &.uptime-card {
      background: linear-gradient(0.25turn, #00ac70, #34c388);
    }
  }
  .chart {
    margin-top: 32px;
  }
}
</style>
