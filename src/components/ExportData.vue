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
              <el-option v-for="(format, index) in ['JSON']" :key="index" :value="format"> </el-option>
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

type ExportFormat = 'JSON'

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
      default:
        break
    }
  }
  private async exportJSONData() {
    let filename = this.$t('connections.allConnections')
    let content = ''
    if (!this.record.allConnections) {
      filename = this.connection.name
      content = JSON.stringify(this.connection, null, 2)
      ipcRenderer.send('exportData', filename, content, 'json')
    } else {
      const connections: ConnectionModel[] | [] = await loadConnections()
      content = JSON.stringify(connections, null, 2)
      ipcRenderer.send('exportData', 'data', content, 'json')
    }
    ipcRenderer.on('saved', () => {
      this.$message.success(`${filename} ${this.$t('common.exportSuccess')}`)
      this.resetData()
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
