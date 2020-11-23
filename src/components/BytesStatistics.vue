<template>
  <my-dialog
    :title="$t('connections.bytesStatistics')"
    :visible.sync="showDialog"
    class="bytes-statistics"
    width="900px"
    top="35px"
    @close="resetData"
    @confirm="resetData"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="version-card info-card"> Broker {{ $t('common.version') }}: {{ version }} </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="uptime-card info-card"> {{ $t('common.uptime') }}: {{ uptime }} </el-card>
      </el-col>
      <el-col :span="24">
        <el-card class="chart-card" v-loading="loading">
          <canvas id="bytesChart" width="450" height="200"></canvas>
        </el-card>
      </el-col>
    </el-row>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import Chart from 'chart.js'
import MyDialog from './MyDialog.vue'

@Component({
  components: {
    MyDialog,
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
  private bytesChart: Chart | null = null
  private loading = true
  private chartOption = {}

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
    this.$nextTick(() => {
      if (val && this.bytesChart === null) {
        this.renderChart()
      }
    })
  }

  @Watch('$route.params.id')
  private handleIdChanged() {
    this.initChartDataOption()
  }

  get fontLineColor() {
    return this.theme !== 'light' ? '#fff' : '#666'
  }

  public updateChart() {
    const pushDatasets = (index: number, item: number) => {
      if (this.bytesChart && this.bytesChart.data.datasets && this.bytesChart.data.datasets[index]) {
        const { data } = this.bytesChart.data.datasets[index]
        if (data) {
          data.push(item)
        }
      }
    }
    if (this.bytesChart && this.bytesChart.data && this.bytesChart.data.labels) {
      this.bytesChart.data.labels.push(this.label)
      pushDatasets(0, this.recevied)
      pushDatasets(1, this.sent)
      this.bytesChart.update()
    }
  }

  private initChartDataOption() {
    this.chartOption = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: this.$t('connections.bytesReceived'),
            borderColor: '#ff6384',
            backgroundColor: '#ff638412',
            data: [],
          },
          {
            label: this.$t('connections.bytesSent'),
            borderColor: '#ffce56',
            backgroundColor: '#ffce5612',
            data: [],
          },
        ],
      },
      options: {
        legend: {
          labels: {
            fontColor: this.fontLineColor,
          },
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    }
  }

  private resetData() {
    this.showDialog = false
    this.loading = true
    if (this.bytesChart) {
      this.bytesChart.clear()
      this.bytesChart.destroy()
      this.bytesChart = null
    }
    this.$emit('update:visible', false)
  }

  private renderChart() {
    this.loading = false
    const ctx = document.getElementById('bytesChart')
    this.bytesChart = new Chart(ctx, this.chartOption)
  }

  private created() {
    Chart.defaults.global.defaultFontColor = this.fontLineColor
    this.initChartDataOption()
  }
}
</script>

<style lang="scss">
.bytes-statistics {
  .info-card {
    height: 60px;
    line-height: 60px;
    text-align: center;
    font-size: 16px;
    color: #fff;
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
  .chart-card {
    margin-top: 20px;
  }
}
</style>
