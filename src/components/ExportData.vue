<template>
  <my-dialog
    :title="$t('connections.exportData')"
    :visible.sync="showDialog"
    class="export-data"
    width="350px"
    @confirm="exportData"
    @close="resetData"
    @keyupEnter="exportData"
  >
    <el-form ref="form" label-position="left" label-width="190px" :model="record">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('connections.exportFormat')" prop="exportFormat">
            <el-select size="small" v-model="record.exportFormat">
              <el-option v-for="(format, index) in ['JSON', 'CSV', 'XML', 'Excel']" :key="index" :value="format">
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
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'
import { loadConnections } from '@/api/connection'
import MyDialog from './MyDialog.vue'
import XMLConvert from 'xml-js'
import { parse as CSVConvert } from 'json2csv'
import ExcelConvert, { WorkBook } from 'xlsx'

type ExportFormat = 'JSON' | 'XML' | 'CSV' | 'Excel'

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
  private record: ExportForm = {
    exportFormat: 'JSON',
    allConnections: false,
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private exportData() {
    switch (this.record.exportFormat) {
      case 'JSON':
        this.exportJSONData()
        break
      case 'XML':
        this.exportXMLData()
        break
      case 'CSV':
        this.exportCSVData()
        break
      case 'Excel':
        this.exportExcelData()
        break
      default:
        break
    }
  }

  private exportDiffFormatData(content: string, format: ExportFormat) {
    const fileFormat = format.toLowerCase() as ExportFormat
    let filename = this.$t('connections.allConnections')
    if (!this.record.allConnections) {
      filename = this.connection.name
      ipcRenderer.send('exportData', filename, content, fileFormat)
    } else {
      ipcRenderer.send('exportData', 'data', content, fileFormat)
    }
    ipcRenderer.on('saved', () => {
      this.$message.success(`${filename} ${this.$t('common.exportSuccess')}`)
      this.resetData()
    })
  }

  private async getStringifyContent(): Promise<string> {
    if (!this.record.allConnections) {
      const { ...connection } = this.connection
      const data = [connection]
      const content = JSON.stringify(data[0], null, 2)
      return content
    } else {
      const connections: ConnectionModel[] | [] = await loadConnections()
      const data = connections
      const content = JSON.stringify(data, null, 2)
      return content
    }
  }

  private exportJSONData() {
    this.getStringifyContent()
      .then((content) => {
        if (content === '[]') {
          this.$message.warning(this.$t('common.noData') as string)
          return
        }
        this.exportDiffFormatData(content, 'JSON')
      })
      .catch((err) => {
        this.$message.error(err.toString())
      })
  }

  private async exportExcelData() {
    const data: ConnectionModel[] = !this.record.allConnections ? [this.connection] : await loadConnections()
    const fileName = !this.record.allConnections ? this.connection.name : 'data'
    const saveExcelData = (workbook: WorkBook) => {
      let filename = this.$t('connections.allConnections')
      if (!this.record.allConnections) {
        filename = this.connection.name
        ipcRenderer.send('exportData', filename, workbook)
      } else {
        ipcRenderer.send('exportData', 'data', workbook)
      }
      ipcRenderer.on('saved', () => {
        this.$message.success(`${filename} ${this.$t('common.exportSuccess')}`)
        this.resetData()
      })
    }

    if (!data.length) {
      this.$message.warning(this.$t('common.noData') as string)
      return
    }
    const jsonContent = data
    const sheet = ExcelConvert.utils.json_to_sheet(jsonContent)
    Object.keys(sheet).forEach((item) => {
      // format nested object/array to string
      if (sheet[item].t === undefined && item !== '!ref') {
        const stringValue = JSON.stringify(sheet[item])
        sheet[item] = { t: 's', v: stringValue }
      }
    })
    const newWorkBook = ExcelConvert.utils.book_new()
    ExcelConvert.utils.book_append_sheet(newWorkBook, sheet)
    saveExcelData(newWorkBook)
  }

  private exportXMLData() {
    const exportDataToXML = (jsonContent: string) => {
      // avoid messages: [] & subscriptions: [] being discarded
      jsonContent = jsonContent.replace(/\[\]/g, '""')
      const XMLOptions = { compact: true, ignoreComment: true, spaces: 2 }
      try {
        let content = XMLConvert.json2xml(jsonContent, XMLOptions)
        content = '<?xml version="1.0" encoding="utf-8"?>\n<root>\n'.concat(content).concat('\n</root>')
        content = content.replace(/<([0-9]*)>/g, '<oneConnection>').replace(/<(\/[0-9]*)>/g, '</oneConnection>')
        this.exportDiffFormatData(content, 'XML')
      } catch (err) {
        this.$message.error(err.toString())
      }
    }
    this.getStringifyContent()
      .then((content) => {
        if (content === '[]') {
          this.$message.warning(this.$t('common.noData') as string)
          return
        }
        exportDataToXML(content)
      })
      .catch((err) => {
        this.$message.error(err.toString())
      })
  }

  private async exportCSVData() {
    const exportDataToCSV = (jsonContent: ConnectionModel[]) => {
      try {
        const content: string = CSVConvert(jsonContent)
        this.exportDiffFormatData(content, 'CSV')
      } catch (err) {
        this.$message.error(err.toString())
      }
    }
    const data: ConnectionModel[] = !this.record.allConnections ? [this.connection] : await loadConnections()
    if (!data.length) {
      this.$message.warning(this.$t('common.noData') as string)
      return
    }
    const jsonContent = data
    exportDataToCSV(jsonContent)
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
    ipcRenderer.removeAllListeners('saved')
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
