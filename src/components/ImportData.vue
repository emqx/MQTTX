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
              <el-option
                v-for="(format, index) in ['JSON', 'YAML', 'CSV', 'XML', 'Excel']"
                :key="index"
                :value="format"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="22">
          <el-form-item :label="$t('connections.importFile')">
            <el-tooltip placement="top" :effect="theme !== 'light' ? 'light' : 'dark'" :open-delay="500">
              <div slot="content" v-html="$t('connections.importConnectionsTip')"></div>
              <a href="javascript:;" class="icon-tip">
                <i class="el-icon-question"></i>
              </a>
            </el-tooltip>
            <el-input size="small" v-model="record.filePath" @change="handleFilePathChange"></el-input>
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
        <el-collapse-transition>
          <div v-if="record.fileName">
            <el-col :span="24">
              <el-progress
                :text-inside="true"
                :stroke-width="24"
                :percentage="getProgressNumber(this.importMsgsProgress)"
                color="#34c388"
              ></el-progress>
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
import YAML from 'js-yaml'
import XMLConvert from 'xml-js'
import CSVConvert from 'csvtojson'
import ExcelConvert from 'xlsx'
import useServices from '@/database/useServices'
import {
  emptyArray,
  specialDataTypes,
  stringProps,
  recoverSpecialDataTypes,
  recoverSpecialDataTypesFromString,
} from '@/utils/exportData'
import { ElLoadingComponent } from 'element-ui/types/loading'
import delay from '@/utils/delay'

type ImportFormat = 'JSON' | 'YAML' | 'XML' | 'CSV' | 'Excel'

interface ImportForm {
  importFormat: ImportFormat
  filePath: string
  fileName: string
  fileContent: ConnectionModel[]
}

interface XMLParentElement {
  [propName: string]: any
}

@Component({
  components: {
    MyDialog,
  },
})
export default class ImportData extends Vue {
  @Getter('currentTheme') private theme!: Theme

  @Prop({ default: false }) public visible!: boolean

  private importMsgsProgress = 0
  private showDialog: boolean = this.visible
  private confirmLoading: boolean = false
  private record: ImportForm = {
    importFormat: 'JSON',
    filePath: '',
    fileName: '',
    fileContent: [],
  }

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private handleFilePathChange(val: string) {
    if (!val) {
      return
    }
    this.readFilePath(val, this.getExtensionName())
  }

  private getExtensionName() {
    const lowerFormat = this.record.importFormat.toLowerCase()
    return lowerFormat === 'excel' ? 'xlsx' : lowerFormat
  }

  private getFileData() {
    let loading: ElLoadingComponent | undefined = undefined
    const extensionName = this.getExtensionName()
    remote.dialog
      .showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: '', extensions: [`${extensionName}`] }],
      })
      .then((res) => {
        const { filePaths } = res
        if (filePaths.length) {
          loading = this.$loading({
            target: '.import-data .el-dialog',
            spinner: 'el-icon-loading',
          })
          const filePath = filePaths[0]
          this.readFilePath(filePath, extensionName)
        }
      })
      .catch(() => {})
      .finally(() => {
        loading?.close()
      })
  }

  private getExcelContentByXlsx(filePath: string) {
    const workbook = ExcelConvert.readFile(filePath, { cellDates: true, dateNF: 'dd/mm/yyyy' })
    const sheets = workbook.Sheets
    let caughtError = false
    let content: any[] = []
    for (const sheet in sheets) {
      if (sheets.hasOwnProperty(sheet)) {
        const oneSheetJson = ExcelConvert.utils.sheet_to_json(sheets[sheet])
        content = content.concat(oneSheetJson)
      }
    }

    const parseStringProps = (connection: any): ConnectionModel => {
      let { messages, subscriptions, properties, will } = connection
      try {
        messages = JSON.parse(messages)
        subscriptions = JSON.parse(subscriptions)
        properties = JSON.parse(properties)
        will = JSON.parse(will)
      } catch (err) {
        const error = err as unknown as Error
        this.$message.error(error.toString())
        caughtError = true
      }
      return Object.assign(connection, { messages, subscriptions, properties, will })
    }
    const jsonContent = content.map((connection): ConnectionModel => parseStringProps(connection))
    if (!caughtError) {
      this.assignValueToRecord(filePath, jsonContent)
    }
  }

  private readFilePath(filePath: string, extensionName: string) {
    if (extensionName === 'xlsx') {
      this.getExcelContentByXlsx(filePath)
    } else {
      this.getFileContentByFs(filePath)
    }
  }

  private getFileContentByFs(filePath: string) {
    fs.readFile(filePath, 'utf-8', (err, content) => {
      if (err) {
        this.$message.error(`${this.$t('connections.readFileErr')}${err.message}`)
        return
      }
      try {
        const fileContent = this.getDiffFormatData(content)
        this.assignValueToRecord(filePath, fileContent)
      } catch (err) {
        const error = err as unknown as Error
        this.$message.error(error.toString())
      }
    })
  }

  private assignValueToRecord(filePath: string, fileContent: ConnectionModel[] | undefined) {
    if (fileContent) {
      const res = this.verifyFileContent(fileContent)
      if (!res) {
        this.$message.error(this.$tc('connections.fileContentRequired'))
        return
      }
      this.record.filePath = filePath
      const nameIndex = filePath.split('/').length - 1
      this.record.fileName = filePath.split('/')[nameIndex]
      this.record.fileContent = fileContent
    }
  }

  private verifyFileContent(data: ConnectionModel[]) {
    const hasRequiredItem = (oneConnection: ConnectionModel): boolean => {
      const { clientId, name, host, port, ssl, certType, ca } = oneConnection
      return !(!clientId || !name || !host || !port || (ssl && !certType) || (certType === 'self' && !ca))
    }
    return data.every(hasRequiredItem)
  }

  private getDiffFormatData(content: string): ConnectionModel[] | undefined {
    switch (this.record.importFormat) {
      case 'JSON':
        return this.getJSONData(content)
        break
      case 'YAML':
        return this.getYAMLData(content)
        break
      case 'CSV':
        return this.getCSVData(content)
        break
      case 'XML':
        return this.getXMLData(content)
        break
      default:
        break
    }
  }

  private getJSONData(data: string): ConnectionModel[] {
    const _data = JSON.parse(data)
    const fileContent: ConnectionModel[] = Array.isArray(_data) ? _data : [_data]
    return fileContent
  }

  private getYAMLData(data: string): ConnectionModel[] {
    const fileContent = YAML.load(data) as ConnectionModel[]
    return fileContent
  }

  private getXMLData(data: string): ConnectionModel[] {
    const removeJsonTextAttribute = (value: string, parentElement: XMLParentElement) => {
      try {
        const nativeType = (key: string, value: string) => {
          const lowerValue = value.toLowerCase()
          if (lowerValue === 'true') {
            return true
          } else if (lowerValue === 'false') {
            return false
          } else if (specialDataTypes.includes(value)) {
            return recoverSpecialDataTypes(value)
          } else if (/(\d+\.(\d+)?0)/.test(value)) {
            // format string number
            return value
          } else if (!stringProps.includes(key) && value !== '') {
            // format number
            const numValue = Number(value)
            return !isNaN(numValue) ? numValue : value
          }
          return value
        }
        const keyNameIndex = Object.keys(parentElement._parent).length - 1
        const keyName = Object.keys(parentElement._parent)[keyNameIndex]
        parentElement._parent[keyName] = nativeType(keyName, value)
      } catch (err) {
        const error = err as unknown as Error
        this.$message.error(error.toString())
      }
    }
    const convertRightStringAndArray = (data: string) => {
      let fileContent: ConnectionModel[] = []
      try {
        const jsonData = JSON.parse(data)
        const isOneConnection = !jsonData.root.oneConnection || !Array.isArray(jsonData.root.oneConnection)
        if (isOneConnection) {
          // { root: {} or root: { oneConnection : {} } }
          const isSimpleObj = jsonData.root.oneConnection === undefined
          const oneConnection: ConnectionModel = isSimpleObj ? jsonData.root : jsonData.root.oneConnection
          fileContent = oneConnection ? [oneConnection] : []
        } else {
          // { root: { oneConnection : [] } }
          const { oneConnection: connections }: { oneConnection: ConnectionModel[] } = jsonData.root
          fileContent = connections
        }
        fileContent.forEach((connection) => {
          const { messages, subscriptions } = connection
          if (!Array.isArray(messages)) connection.messages = [messages]
          if (!Array.isArray(subscriptions)) connection.subscriptions = [subscriptions]
        })
      } catch (err) {
        const error = err as unknown as Error
        this.$message.error(error.toString())
      }
      return fileContent
    }
    const XMLOptions = {
      compact: true,
      ignoreComment: true,
      ignoreDeclaration: true,
      ignoreInstruction: true,
      ignoreAttributes: true,
      ignoreCdata: true,
      ignoreDoctype: true,
      textFn: removeJsonTextAttribute,
    }
    const formatedData = XMLConvert.xml2json(data, XMLOptions)
    return convertRightStringAndArray(formatedData)
  }

  private getCSVData(data: string): ConnectionModel[] {
    const fileContent: ConnectionModel[] = []
    CSVConvert()
      .fromString(data)
      .subscribe((jsonObj) => {
        const formatObj = (obj: any) => {
          if (obj) {
            const objStr = typeof obj === 'string' ? obj : JSON.stringify(obj)
            const objStrFormat = recoverSpecialDataTypesFromString(objStr)
              .replace(/"=\\"(\d+\.(\d+)?0)\\""/g, '"$1"')
              .replace(/:"true"/g, ':true')
              .replace(/:"false"/g, ':false')
            return JSON.parse(objStrFormat)
          }
          return obj
        }

        let { messages, subscriptions, properties, will, ...otherProps } = jsonObj

        if (messages === emptyArray) messages = []
        if (subscriptions === emptyArray) subscriptions = []

        try {
          messages = formatObj(messages)
          subscriptions = formatObj(subscriptions)
          properties = formatObj(properties)
          will = formatObj(will)
          otherProps = formatObj(otherProps)
          // Convert string number to number
          Object.keys(otherProps).forEach((item) => {
            if (typeof otherProps[item] === 'string' && otherProps[item] !== '' && !stringProps.includes(item)) {
              const numValue = Number(otherProps[item])
              otherProps[item] = !isNaN(numValue) ? numValue : otherProps[item]
            }
          })
          fileContent.push({ messages, subscriptions, properties, will, ...otherProps })
        } catch (err) {
          const error = err as unknown as Error
          this.$message.error(error.toString())
        }
      })
    return fileContent
  }

  private async importData() {
    this.confirmLoading = true
    try {
      const { connectionService } = useServices()
      if (!this.record.fileContent.length) {
        this.$message.error(this.$tc('connections.uploadFileTip'))
        return
      }
      const importDataResult = await connectionService.import(this.record.fileContent, (progress) => {
        this.importMsgsProgress = progress
      })
      if (importDataResult === 'ok') {
        this.$message.success(this.$tc('common.importSuccess'))
        setTimeout(() => {
          this.resetData()
          location.reload()
        }, 2000)
      } else {
        this.$message.error(importDataResult)
      }
    } catch (err) {
      const error = err as unknown as Error
      this.$message.error(error.toString())
    } finally {
      this.confirmLoading = false
    }
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
    this.record = {
      importFormat: 'JSON',
      filePath: '',
      fileName: '',
      fileContent: [],
    }
    this.importMsgsProgress = 0
  }

  private getProgressNumber(progress: number | string) {
    return typeof progress === 'string' ? Math.floor(Number(progress) * 100) : Math.floor(progress * 100)
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
