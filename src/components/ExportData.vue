<template>
  <my-dialog
    :title="$t('connections.exportData')"
    :visible.sync="showDialog"
    class="export-data"
    width="350px"
    :confirmLoading="confirmLoading"
    @confirm="exportData"
    @close="resetData"
    @keyupEnter="exportData"
  >
    <el-form ref="form" label-position="left" label-width="190px" :model="record">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('connections.exportFormat')" prop="exportFormat">
            <el-select size="small" v-model="record.exportFormat">
              <el-option
                v-for="(format, index) in ['JSON', 'YAML', 'CSV', 'XML', 'Excel']"
                :key="index"
                :value="format"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item class="swtich-item" :label="$t('connections.allConnections')" prop="allConnections">
            <el-tooltip
              v-if="connection"
              placement="top"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('connections.allConnectionsTips')"
            >
              <a href="javascript:;" class="icon-tip">
                <i class="el-icon-question"></i>
              </a>
            </el-tooltip>
            <el-switch v-model="record.allConnections" :disabled="!connection"></el-switch>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-dialog
      width="50%"
      :title="$t('settings.exportProgress')"
      :close-on-click-modal="false"
      :visible.sync="progressVisible"
      append-to-body
    >
      <el-progress :percentage="getProgressNumber(this.exportProgress)" color="#34c388"></el-progress>
    </el-dialog>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'
import MyDialog from './MyDialog.vue'

type ExportFormat = 'JSON' | 'YAML' | 'XML' | 'CSV' | 'Excel'

interface ExportForm {
  exportFormat: ExportFormat
  allConnections: boolean
}

@Component({
  components: {
    MyDialog,
  },
})
export default class ExportData extends Vue {
  @Getter('currentTheme') private theme!: Theme

  @Prop({ default: undefined }) public connection!: ConnectionModel
  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible
  private confirmLoading: boolean = false
  private progressVisible = false
  private exportProgress = 0
  private record: ExportForm = {
    exportFormat: 'JSON',
    allConnections: false,
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private exportData() {
    // Use stream export for all formats to avoid memory issues
    this.streamExportData()
  }

  private streamExportData() {
    this.confirmLoading = true

    let filename = this.$t('connections.allConnections') as string
    if (!this.record.allConnections) {
      filename = this.connection.name
    }

    const connectionId = this.record.allConnections ? undefined : this.connection.id

    ipcRenderer.send('streamExportData', filename, this.record.exportFormat, connectionId)

    // Listen for progress updates
    ipcRenderer.on('exportProgress', (event, progress: number) => {
      // Show progress dialog when first progress event is received (after user selects save location)
      if (!this.progressVisible) {
        this.progressVisible = true
      }
      this.exportProgress = progress
    })

    ipcRenderer.on('saved', () => {
      // Show 100% progress for a moment before closing
      this.exportProgress = 1

      setTimeout(() => {
        this.$message.success(`${filename} ${this.$t('common.exportSuccess')}`)
        this.resetData()
      }, 800) // Wait 800ms to let user see the completion
    })

    ipcRenderer.on('exportError', (event, error: string) => {
      this.$message.error(`Export failed: ${error}`)
      this.progressVisible = false
      this.confirmLoading = false
    })
  }

  private resetData() {
    this.showDialog = false
    this.progressVisible = false
    this.$emit('update:visible', false)
    this.confirmLoading = false
    this.exportProgress = 0
    ipcRenderer.removeAllListeners('saved')
    ipcRenderer.removeAllListeners('exportProgress')
    ipcRenderer.removeAllListeners('exportError')
  }

  private getProgressNumber(progress: number | string) {
    return Number((typeof progress === 'string' ? Number(progress) * 100 : progress * 100).toFixed(1))
  }

  private created() {
    this.record.allConnections = !this.connection ? true : false
  }
}
</script>

<style lang="scss">
.export-data {
  .el-dialog__body {
    padding-bottom: 0px;
    .el-tooltip.icon-tip {
      position: absolute;
      right: 195px;
      font-size: 16px;
      color: var(--color-text-tips);
    }
    .swtich-item {
      .el-form-item__content {
        text-align: right;
      }
    }
  }
}
</style>
