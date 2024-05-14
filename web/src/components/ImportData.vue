<template>
  <my-dialog
    :title="$t('connections.importData')"
    :visible.sync="showDialog"
    class="import-data"
    width="350px"
    :confirmLoading="confirmLoading"
    @confirm="importData"
    @close="resetData"
  >
    <el-alert
      class="import-data-tip"
      :title="$t('connections.importDataTip')"
      type="warning"
      show-icon
      :closable="false"
    >
    </el-alert>
    <el-form ref="form" label-position="left" label-width="130px" :model="record">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('connections.importFormat')">
            <el-select size="small" v-model="record.importFormat">
              <el-option v-for="(format, index) in ['JSON']" :key="index" :value="format"> </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="22">
          <el-form-item :label="$t('connections.importFile')">
            <el-tooltip placement="top" :effect="theme !== 'light' ? 'light' : 'dark'" :open-delay="500">
              <div slot="content" v-html="$t('connections.importConnectionsTip')">
                {{ $t('connections.importConnectionsTip') }}
              </div>
              <a href="javascript:;" class="icon-tip">
                <i class="el-icon-question"></i>
              </a>
            </el-tooltip>
            <el-input size="small" v-model="record.fileName" readonly></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="2">
          <div>
            <input type="file" ref="fileInput" accept=".json" @change="getFileData" style="display: none" />
            <a href="javascript:;" class="icon-upload" @click="triggerFileInput">
              <i class="el-icon-folder-opened"></i>
            </a>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { importAllData } from '@/utils/api/setting'
import MyDialog from './MyDialog.vue'
import { ElLoadingComponent } from 'element-ui/types/loading'

type ImportFormat = 'JSON'

interface ImportForm {
  importFormat: ImportFormat
  fileName: string
  fileContent?: string
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
  private confirmLoading: boolean = false
  private record: ImportForm = {
    importFormat: 'JSON',
    fileName: '',
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private triggerFileInput() {
    ;(this.$refs.fileInput as HTMLInputElement).click()
  }

  private getFileData(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    this.getFileContentByFileReader(file)
  }

  private getFileContentByFileReader(file: File) {
    let loading: ElLoadingComponent | undefined = undefined
    let reader = new FileReader()
    reader.readAsText(file)
    reader.onloadstart = () => {
      loading = this.$loading({
        target: '.import-data .el-dialog',
        spinner: 'el-icon-loading',
      })
    }
    reader.onloadend = () => {
      loading?.close()
    }
    reader.onerror = () => {
      this.$message.error(`${this.$t('connections.readFileErr')}${reader.error?.message}`)
    }
    reader.onload = () => {
      this.record.fileName = file.name
      this.record.fileContent = this.getDiffFormatData(reader.result as string)
    }
  }

  private getDiffFormatData(content: string): string | undefined {
    switch (this.record.importFormat) {
      case 'JSON':
        return this.getJSONData(content)
        break
      default:
        break
    }
  }

  private getJSONData(data: string): string {
    return data
  }

  private async importData() {
    this.confirmLoading = true
    if (!this.record.fileContent) {
      this.$message.error(this.$tc('connections.uploadFileTip'))
      return
    }
    importAllData(this.record.fileContent)
    this.confirmLoading = false
    this.$message.success(this.$tc('common.importSuccess'))
    this.resetData()
    setTimeout(() => {
      location.reload()
    }, 1000)
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
    this.record = {
      importFormat: 'JSON',
      fileName: '',
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
