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
          <el-form-item :label="$t('connections.importFormat')">
            <el-select size="small" v-model="record.importFormat">
              <el-option v-for="(format, index) in ['JSON', 'CSV', 'XML', 'Excel']" :key="index" :value="format">
              </el-option>
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
import { importConnections } from '@/api/connection'
import { ConnectionModel, MessageModel } from '@/views/connections/types'
import MyDialog from './MyDialog.vue'
import XMLConvert from 'xml-js'
import CSVConvert from 'csvtojson'
import ExcelConvert from 'xlsx'

type ImportFormat = 'JSON' | 'XML' | 'CSV' | 'Excel'

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

  private showDialog: boolean = this.visible
  private record: ImportForm = {
    importFormat: 'JSON',
    filePath: '',
    fileName: '',
    fileContent: [],
  }
  // properties with string values may be 'number'
  private stringProps: string[] = [
    'clientId',
    'name',
    'password',
    'topic',
    'username',
    'lastWillPayload',
    'lastWillTopic',
    'contentType',
  ]

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private getFileData() {
    const lowerFormat = this.record.importFormat.toLowerCase()
    const extensionName = lowerFormat === 'excel' ? 'xlsx' : lowerFormat
    remote.dialog.showOpenDialog(
      {
        properties: ['openFile'],
        filters: [{ name: '', extensions: [`${extensionName}`] }],
      },
      (files) => {
        if (files) {
          const filePath = files[0]
          if (extensionName === 'xlsx') {
            this.getExcelContentByXlsx(filePath)
          } else {
            this.getFileContentByFs(filePath)
          }
        }
      },
    )
  }

  private getExcelContentByXlsx(filePath: string) {
    const workbook = ExcelConvert.readFile(filePath)
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
      let { client, messages, will, subscriptions } = connection
      try {
        client = JSON.parse(client)
        messages = JSON.parse(messages)
        will = JSON.parse(will)
        subscriptions = JSON.parse(subscriptions)
      } catch (err) {
        this.$message.error(err.toString())
        caughtError = true
      }
      return Object.assign(connection, { client, messages, will, subscriptions })
    }
    const jsonContent = content.map((connection): ConnectionModel => parseStringProps(connection))
    if (!caughtError) {
      this.assignValueToRecord(filePath, jsonContent)
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
        this.$message.error(err.toString())
      }
    })
  }

  private assignValueToRecord(filePath: string, fileContent: ConnectionModel[] | undefined) {
    if (fileContent) {
      const res = this.verifyFileContent(fileContent)
      if (!res) {
        this.$message.error(this.$t('connections.fileContentRequired') as string)
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

  private getXMLData(data: string): ConnectionModel[] {
    const removeJsonTextAttribute = (value: string, parentElement: XMLParentElement) => {
      try {
        const nativeType = (value: string) => {
          const lowerValue = value.toLowerCase()
          if (lowerValue === 'true') {
            return true
          } else if (lowerValue === 'false') {
            return false
          } else if (lowerValue !== '') {
            // format number
            const numValue = Number(value)
            const convertedValue = !isNaN(numValue) ? numValue : value
            return convertedValue
          }
          return value
        }
        const keyNameIndex = Object.keys(parentElement._parent).length - 1
        const keyName = Object.keys(parentElement._parent)[keyNameIndex]
        parentElement._parent[keyName] = this.stringProps.indexOf(keyName) !== -1 ? value : nativeType(value)
      } catch (err) {
        this.$message.error(err.toString())
      }
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
    return this.convertRightStringAndArray(formatedData)
  }

  private convertRightStringAndArray(data: string): ConnectionModel[] {
    let fileContent: ConnectionModel[] = []
    try {
      const jsonData = JSON.parse(data)
      const isOneConnection = !jsonData.root.oneConnection || !Array.isArray(jsonData.root.oneConnection)

      const convertOneConnection = (oneConnection: ConnectionModel): ConnectionModel | undefined => {
        const { ca, cert, certType, key, password, username, will } = oneConnection
        // empty string
        const isStringTypeProps = { ca, cert, certType, key, password, username, will }
        const isStringTypePropsStr = JSON.stringify(isStringTypeProps).replace(/\{\}/g, '""')

        // one message/subscription
        let { messages, subscriptions } = oneConnection
        if (messages === undefined || subscriptions === undefined) {
          this.$message.error(this.$t('connections.uploadFileTip') as string)
          return
        }
        messages = JSON.stringify(messages) !== '{}' && !Array.isArray(messages) ? [messages] : messages
        subscriptions =
          JSON.stringify(subscriptions) !== '{}' && !Array.isArray(subscriptions) ? [subscriptions] : subscriptions

        // empty message/subscription
        const isArrayTypeProps = { messages, subscriptions }
        const isArrayTypePropsStr = JSON.stringify(isArrayTypeProps).replace(/\{\}/g, '[]')

        const convertedString = JSON.parse(isStringTypePropsStr)
        const convertedArray = JSON.parse(isArrayTypePropsStr)

        return Object.assign(oneConnection, convertedString, convertedArray)
      }

      if (isOneConnection) {
        // { root: {} or root: { oneConnection : {} } }
        const isSimpleObj = jsonData.root.oneConnection === undefined
        let oneConnection: ConnectionModel = isSimpleObj ? jsonData.root : jsonData.root.oneConnection
        const convertedResult = convertOneConnection(oneConnection)
        fileContent = convertedResult ? [convertedResult] : []
      } else {
        // { root: { oneConnection : [] } }
        const { oneConnection: connections }: { oneConnection: ConnectionModel[] } = jsonData.root
        const convertedArray = connections.map((oneConnection) => convertOneConnection(oneConnection))
        if (convertedArray.indexOf(undefined) === -1) {
          fileContent = convertedArray as ConnectionModel[]
        }
      }
    } catch (err) {
      this.$message.error(err.toString())
    }
    return fileContent
  }

  private getCSVData(data: string): ConnectionModel[] {
    const fileContent: ConnectionModel[] = []
    CSVConvert()
      .fromString(data)
      .subscribe((jsonObj) => {
        try {
          let { client, messages, subscriptions, will, ...otherProps } = jsonObj
          // format object
          client = JSON.parse(client)
          messages = JSON.parse(messages)
          subscriptions = JSON.parse(subscriptions)
          will = JSON.parse(will)
          Object.keys(otherProps).forEach((item) => {
            // format boolean
            if (otherProps[item] === 'true') {
              otherProps[item] = true
            } else if (otherProps[item] === 'false') {
              otherProps[item] = false
            } else if (this.stringProps.indexOf(item) === -1 && otherProps[item] !== '') {
              // format number
              const numValue = Number(otherProps[item])
              otherProps[item] = !isNaN(numValue) ? numValue : otherProps[item]
            }
          })
          const oneRealJSONObj = {
            client,
            messages,
            subscriptions,
            will,
            ...otherProps,
          }
          fileContent.push(oneRealJSONObj)
        } catch (err) {
          this.$message.error(err.toString())
        }
      })
    return fileContent
  }

  private async importData() {
    if (!this.record.fileContent.length) {
      this.$message.error(this.$t('connections.uploadFileTip') as string)
      return
    }
    const importDataResult = await importConnections(this.record.fileContent)
    if (importDataResult === 'ok') {
      this.$message.success(this.$t('common.importSuccess') as string)
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
      fileName: '',
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
  .icon-file-name {
    cursor: default;
  }
  .el-col-2 {
    padding-left: 5px !important;
  }
}
</style>
