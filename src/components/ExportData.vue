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
              <el-option v-for="(format, index) in ['JSON', 'XML', 'CSV']" :key="index" :value="format"> </el-option>
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
import { loadConnections } from '@/utils/api/connection'
import MyDialog from './MyDialog.vue'
import { ConnectionModel } from '@/views/connections/types'
import XMLConvert from 'xml-js'
const { parse: CSVConvert } = require('json2csv')

type ExportFormat = 'JSON' | 'XML' | 'CSV'

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
  private onChildChanged(val: boolean) {
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
      default:
        break
    }
  }

  private async exportDiffFormatData(content: string, format: ExportFormat) {
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

  private async exportJSONData() {
    let content = ''
    if (!this.record.allConnections) {
      content = JSON.stringify(this.connection, null, 2)
      this.exportDiffFormatData(content, 'JSON')
    } else {
      const connections: ConnectionModel[] | [] = await loadConnections()
      content = JSON.stringify(connections, null, 2)
      this.exportDiffFormatData(content, 'JSON')
    }
  }

  private async exportXMLData() {
    const exportDataToXML = (jsonContent: string) => {
      const XMLOptions = { compact: true, ignoreComment: true, spaces: 4 }
      let content = XMLConvert.json2xml(jsonContent, XMLOptions)
      content = '<?xml version="1.0" encoding="utf-8"?>\n<root>\n'.concat(content).concat('\n</root>')
      this.exportDiffFormatData(content, 'XML')
    }
    let jsonContent = ''
    if (!this.record.allConnections) {
      jsonContent = JSON.stringify(this.connection, null, 2)
      exportDataToXML(jsonContent)
    } else {
      const connections: ConnectionModel[] | [] = await loadConnections()
      jsonContent = JSON.stringify(connections, null, 2)
      exportDataToXML(jsonContent)
    }
  }

  private async exportCSVData() {
    const exportDataToCSV = (jsonContent: ConnectionModel[]) => {
      const content = CSVConvert(jsonContent)
      this.exportDiffFormatData(content, 'CSV')
    }
    if (!this.record.allConnections) {
      exportDataToCSV([this.connection])
    } else {
      const connections: ConnectionModel[] | [] = await loadConnections()
      exportDataToCSV(connections)
    }
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
