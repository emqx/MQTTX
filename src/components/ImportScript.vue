<template>
  <my-dialog
    :title="title"
    :visible.sync="showDialog"
    class="import-data"
    width="350px"
    :confirmLoading="confirmLoading"
    @confirm="importData"
    @close="resetData"
  >
    <el-form ref="form" label-position="left" label-width="130px" :model="record">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('connections.importFormat')">
            <el-input size="small" v-model="format" readonly></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="22">
          <el-form-item :label="$t('connections.importFile')">
            <el-input size="small" v-model="record.filePath"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="2">
          <a href="javascript:;" class="icon-upload" @click="getFileData">
            <i class="el-icon-folder-opened"></i>
          </a>
        </el-col>
        <el-collapse-transition>
          <div v-if="record.fileName">
            <el-col :span="22">
              <el-form-item :label="$t('connections.flieName')">
                <el-input size="small" v-model="record.fileName" readonly></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <a href="javascript:;" class="icon-upload icon-file-name">
                <i class="el-icon-document-checked"></i>
              </a>
            </el-col>
          </div>
        </el-collapse-transition>
      </el-row>
    </el-form>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import fs from 'fs'
import { remote } from 'electron'
import MyDialog from './MyDialog.vue'
import useServices from '@/database/useServices'
import { ElLoadingComponent } from 'element-ui/types/loading'

@Component({
  components: {
    MyDialog,
  },
})
export default class ImportScript extends Vue {
  @Getter('currentTheme') private theme!: Theme

  @Prop({ default: false }) public visible!: boolean
  @Prop({ required: true }) public title!: string
  @Prop({ required: true }) public extension!: string
  @Prop({ required: true }) public format!: FunctionType | SchemaType

  private showDialog: boolean = this.visible
  private confirmLoading: boolean = false
  private record: ImportScriptForm = {
    filePath: '',
    fileName: '',
    fileContent: '',
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private getFileData() {
    let loading: ElLoadingComponent | undefined = undefined
    const extensions = this.extension === 'avsc' ? ['avsc', 'json'] : [`${this.extension}`]
    remote.dialog
      .showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: '', extensions }],
      })
      .then((res) => {
        const { filePaths } = res
        if (filePaths.length) {
          loading = this.$loading({
            target: '.import-data .el-dialog',
            spinner: 'el-icon-loading',
          })
          const filePath = filePaths[0]
          this.getFileContentByFs(filePath)
        }
      })
      .catch((err: Error) => {
        this.$message.error(err.message)
      })
      .finally(() => {
        loading?.close()
      })
  }

  private getFileContentByFs(filePath: string) {
    fs.readFile(filePath, 'utf-8', (err, content) => {
      if (err) {
        this.$message.error(`${this.$t('connections.readFileErr')}${err.message}`)
        return
      }
      try {
        this.assignValueToRecord(filePath, content)
      } catch (err) {
        this.$message.error((err as Error).toString())
      }
    })
  }

  private assignValueToRecord(filePath: string, fileContent: string) {
    if (fileContent) {
      if (!fileContent) {
        this.$message.error(this.$tc('connections.fileContentRequired'))
        return
      }
      this.record.filePath = filePath
      const nameIndex = filePath.split('/').length - 1
      this.record.fileName = filePath.split('/')[nameIndex]
      this.record.fileContent = fileContent
    }
  }

  private async importData() {
    this.confirmLoading = true
    if (!this.record.fileContent.length) {
      this.$message.error(this.$tc('connections.uploadFileTip'))
      return
    }
    this.confirmLoading = false
    // avoid display twice message
    // this.$message.success(this.$tc('common.importSuccess'))
    this.$emit('finish', this.record)
    this.resetData()
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
    this.record = {
      filePath: '',
      fileName: '',
      fileContent: '',
    }
  }
}
</script>

<style lang="scss">
.import-data {
  .el-dialog__body {
    padding-bottom: 0px;
  }
  .icon-upload {
    display: inline-block;
    margin-top: 9px;
  }
  .icon-file-name {
    cursor: default;
  }
  .el-col-2 {
    padding-left: 5px !important;
  }
  .el-dialog {
    overflow: hidden;
    .el-loading-mask {
      opacity: 0.5;
    }
  }
  .import-data-tip {
    margin-bottom: 12px;
    word-break: break-word;
  }
}
</style>
