<template>
  <my-dialog
    :title="$t('connections.importData')"
    :visible.sync="showDialog"
    class="import-data"
    width="350px"
    @confirm="importData"
    @close="resetData"
  >
    <el-form ref="form" label-position="left" label-width="130px" :model="record">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('connections.importFormat')" prop="importFormat">
            <el-select size="small" v-model="record.importFormat">
              <el-option v-for="(format, index) in ['JSON']" :key="index" :value="format"> </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="22">
          <el-form-item :label="$t('connections.importFile')" prop="cert">
            <el-tooltip :offset="-57" placement="top" :effect="theme !== 'light' ? 'light' : 'dark'" :open-delay="500">
              <div slot="content" v-html="$t('connections.importConnectionsTip')">
                {{ $t('connections.importConnectionsTip') }}
              </div>
              <a href="javascript:;" class="icon-tip">
                <i class="el-icon-question"></i>
              </a>
            </el-tooltip>
            <el-input size="small" v-model="record.filePath"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="2">
          <a href="javascript:;" class="icon-upload" @click="getFileData">
            <i class="el-icon-folder-opened"></i>
          </a>
        </el-col>
      </el-row>
    </el-form>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { importConnections } from '@/utils/api/connection'
import MyDialog from './MyDialog.vue'
import { ConnectionModel } from '@/views/connections/types'
import { remote } from 'electron'
import fs from 'fs'
import { isArray } from 'lodash'

type ImportFormat = 'JSON'

interface ImportForm {
  importFormat: ImportFormat
  filePath: string
  fileContent: ConnectionModel[]
}

@Component({
  components: {
    MyDialog,
  },
})
export default class ImportData extends Vue {
  @Getter('currentTheme') private theme!: Theme

  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible
  private record: ImportForm = {
    importFormat: 'JSON',
    filePath: '',
    fileContent: [],
  }

  @Watch('visible')
  private onChildChanged(val: boolean) {
    this.showDialog = val
  }
  private getFileData() {
    remote.dialog.showOpenDialog(
      {
        properties: ['openFile'],
        filters: [{ name: '', extensions: ['json'] }],
      },
      (files) => {
        if (files) {
          const filePath = files[0]
          fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
              this.$message.error(`${this.$t('connections.readFileErr')}${err.message}`)
              return
            }
            try {
              const _data = JSON.parse(data)
              const fileContent = isArray(_data) ? _data : [_data]
              const res = this.verifyFileContent(fileContent)
              if (!res) {
                this.$message.error(`${this.$t('connections.fileContentRequired')}`)
                return
              }
              this.record.filePath = filePath
              this.record.fileContent = fileContent
            } catch (err) {
              this.$message.error(err.toString())
            }
          })
        }
      },
    )
  }
  private verifyFileContent(data: ConnectionModel[]) {
    const hasRequiredItem = (oneConnection: ConnectionModel): boolean => {
      const { clientId, name, host, port, ssl, certType, ca } = oneConnection
      return !(!clientId || !name || !host || !port || (ssl && !certType) || (certType === 'self' && !ca))
    }
    return data.every(hasRequiredItem)
  }
  private importData() {
    if (!this.record.fileContent.length) {
      this.$message.error(`${this.$t('connections.uploadFileTip')}`)
      return
    }
    switch (this.record.importFormat) {
      case 'JSON':
        this.importJSONData()
        break
      default:
        break
    }
  }
  private async importJSONData() {
    const importDataResult = await importConnections(this.record.fileContent)
    if (importDataResult === 'ok') {
      this.$message.success(`${this.$t('common.importSuccess')}`)
      this.$emit('updateData')
      this.resetData()
    } else {
      this.$message.error(importDataResult)
    }
  }
  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
    this.record = {
      importFormat: 'JSON',
      filePath: '',
      fileContent: [],
    }
  }
}
</script>

<style lang="scss">
.import-data {
  .el-dialog__body {
    padding-bottom: 0px;
    .el-tooltip.icon-tip {
      position: absolute;
      right: 195px;
      font-size: 16px;
      color: var(--color-text-tips);
    }
  }
  .icon-upload {
    display: inline-block;
    margin-top: 9px;
  }
  .el-col-2 {
    padding-left: 5px !important;
  }
}
</style>
