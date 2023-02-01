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
import useService from '@/database/useServices'
import MyDialog from './MyDialog.vue'
import XMLConvert from 'xml-js'
import { parse as CSVConvert } from 'json2csv'
import ExcelConvert, { WorkBook } from 'xlsx'
import { replaceSpecialDataTypes } from '@/utils/exportData'

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

  private async getStringifyContent() {
    const { connectionService } = useService()
    let connections: ConnectionModel[] = []
    if (!this.record.allConnections) {
      connections = await connectionService.cascadeGetAll(this.connection.id)
    } else {
      connections = await connectionService.cascadeGetAll()
    }
    return JSON.stringify(connections, null, 2)
  }

  private exportJSONData() {
    this.getStringifyContent()
      .then((content) => {
        if (content === '[]') {
          this.$message.warning(this.$tc('common.noData'))
          return
        }
        this.exportDiffFormatData(content, 'JSON')
      })
      .catch((err) => {
        this.$message.error(err.toString())
      })
  }

  private async exportExcelData() {
    const { connectionService } = useService()
    const data: ConnectionModel[] = !this.record.allConnections
      ? await connectionService.cascadeGetAll(this.connection.id)
      : await connectionService.cascadeGetAll()
    if (!data || !data.length) {
      this.$message.warning(this.$tc('common.noData'))
      return
    }
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
      try {
        let content = replaceSpecialDataTypes(jsonContent)
        content = XMLConvert.json2xml(content, { compact: true, ignoreComment: true, spaces: 2 })
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
          this.$message.warning(this.$tc('common.noData'))
          return
        }
        exportDataToXML(content)
      })
      .catch((err) => {
        this.$message.error(err.toString())
      })
  }

  private async exportCSVData() {
    const exportDataToCSV = (jsonContent: string) => {
      try {
        let content = replaceSpecialDataTypes(jsonContent)
        // Prevent CSV from automatically converting string with trailing zeros after decimal point to number.
        // https://stackoverflow.com/questions/165042/stop-excel-from-automatically-converting-certain-text-values-to-dates
        content = CSVConvert(JSON.parse(content)).replace(/"(\d+\.(\d+)?0)"/g, '="$1"')
        this.exportDiffFormatData(content, 'CSV')
      } catch (err) {
        this.$message.error(err.toString())
      }
    }
    this.getStringifyContent()
      .then((content) => {
        if (content === '[]') {
          this.$message.warning(this.$tc('common.noData'))
          return
        }
        exportDataToCSV(content)
      })
      .catch((err) => {
        this.$message.error(err.toString())
      })
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
