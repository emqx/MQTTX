<template>
  <my-dialog
    :title="$t('connections.bytesStatistics')"
    :visible.sync="showDialog"
    class="system-topic"
    width="900px"
    @close="resetData"
    @confirm="resetData"
  >
    <div v-loading="loading"></div>
    <canvas id="bytesChart" width="450" height="200" v-loading="true"></canvas>
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
            backgroundColor: '#ff638424',
            data: [],
          },
          {
            label: this.$t('connections.bytesSent'),
            borderColor: '#ffce56',
            backgroundColor: '#ffce5624',
            data: [],
          },
        ],
      },
      options: {
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
    this.initChartDataOption()
  }
}
</script>

<style lang="scss"></style>
