<template>
  <div class="script-view rightbar">
    <h1 class="titlebar">
      {{ $t('script.script') }}
    </h1>
    <div class="script-view-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('script.functionTab')" name="functionTab"></el-tab-pane>
        <el-tab-pane :label="$t('script.schemaTab')" name="schemaTab"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="script-view-header">
      <div>
        <el-select v-if="activeTab == functionTab" class="function-select" :value="currentFunction" size="mini">
          <el-option v-for="item in functionList" :key="item.value" :value="item.value" :label="item.label"></el-option>
        </el-select>
        <el-select v-else class="schema-select" :value="currentSchema" size="mini" @change="handleSchemaChange">
          <el-option v-for="item in schemaList" :key="item.value" :value="item.value" :label="item.label"></el-option>
        </el-select>
        <el-select
          size="mini"
          :value="scripts.some((obj) => obj.id === currentScriptId) ? currentScriptId : null"
          placeholder=""
          @change="handleScriptChange"
        >
          <el-option v-for="script in scripts" :key="script.id" :label="script.name" :value="script.id"></el-option>
        </el-select>
        <a v-if="currentScriptId" href="javascript:;" @click="handleCreate">
          <i class="iconfont icon-new"></i>
        </a>
      </div>
      <div>
        <el-button class="upload-btn" size="mini" @click="showImportScript = true">{{ uploadButtonLabel }}</el-button>
        <el-button class="save-btn" type="primary" size="mini" @click="handleSave">{{ $t('common.save') }}</el-button>
        <el-tooltip
          placement="top"
          :disabled="!inUseScript"
          :effect="theme !== 'light' ? 'light' : 'dark'"
          :content="$t('script.inUseScript')"
        >
          <span>
            <el-button
              v-if="currentScriptId"
              class="delete-btn"
              :disabled="inUseScript"
              type="danger"
              size="mini"
              plain
              @click="handleDelete"
            >
              {{ $t('common.delete') }}
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </div>
    <div
      class="editor-container script-editor"
      :style="{
        height: '320px',
      }"
    >
      <Editor
        v-if="activeTab === functionTab"
        ref="functionEditor"
        id="function-editor"
        :key="1"
        :lang="currentFunction"
        v-model="functionEditorValue"
        lineNumbers="on"
        :lineNumbersMinChars="5"
        renderHighlight="line"
        @qucik-save="handleTest"
      />
      <Editor
        v-if="activeTab === schemaTab && currentSchema === 'protobuf'"
        ref="schemaEditor"
        id="schema-editor"
        :key="2"
        :lang="currentFunction"
        :isCustomerLang="true"
        v-model="schemaEditorValue"
        lineNumbers="on"
        :lineNumbersMinChars="5"
        renderHighlight="line"
        @qucik-save="handleTest"
      />
      <Editor
        v-if="activeTab === schemaTab && currentSchema === 'avro'"
        ref="schemaEditor"
        id="schema-editor"
        :key="3"
        :lang="currentFunction"
        :isCustomerLang="true"
        v-model="schemaEditorValue"
        lineNumbers="on"
        :lineNumbersMinChars="5"
        renderHighlight="line"
        @qucik-save="handleTest"
      />
    </div>
    <el-row class="script-test-row script-test-input" :gutter="20">
      <el-col :span="activeTab == schemaTab && currentSchema === 'protobuf' ? 15 : 18">
        <label>{{ $t('script.input') }}</label>
      </el-col>
      <el-col :span="6">
        <el-input
          v-if="activeTab == schemaTab && currentSchema === 'protobuf'"
          :placeholder="$t('script.protoName')"
          v-model.trim="protoName"
          size="mini"
          :label="$t('script.protoName')"
        ></el-input>
      </el-col>
      <el-col :span="activeTab == schemaTab && currentSchema === 'protobuf' ? 3 : 6">
        <el-button class="test-btn" type="outline" size="mini" @click="handleTest">{{ $t('script.test') }}</el-button>
      </el-col>
    </el-row>
    <div
      class="editor-container script-editor script-test-input"
      :style="{
        height: '80px',
      }"
    >
      <Editor
        v-if="activeTab === functionTab"
        :key="3"
        ref="functionInput"
        id="function-input"
        :lang="functionEditorLang"
        lineNumbers="on"
        :lineNumbersMinChars="2"
        v-model="functionInputValue"
      />
      <Editor
        v-if="activeTab === schemaTab"
        :key="4"
        ref="schemaInput"
        id="schema-input"
        :lang="schemaEditorLang"
        lineNumbers="on"
        :lineNumbersMinChars="2"
        v-model="schemaInputValue"
      />
    </div>
    <div class="lang-type">
      <el-radio-group :key="1" v-model="functionInputType" v-if="activeTab === functionTab">
        <el-radio v-for="item in inputTypeList.slice(0, 2)" :key="item" :label="item">{{ item }}</el-radio>
      </el-radio-group>
      <el-radio-group :key="2" v-model="schemaInputType" v-if="activeTab === schemaTab">
        <el-radio v-for="item in inputTypeList" :key="item" :label="item">{{ item }}</el-radio>
      </el-radio-group>
    </div>
    <el-row class="script-test-row script-test-output" :gutter="20">
      <el-col :span="24">
        <label>{{ $t('script.output') }}</label>
        <el-input v-model="outputValue" type="textarea" rows="4" disabled></el-input>
      </el-col>
    </el-row>

    <my-dialog
      :title="$t('script.saveScript')"
      :visible.sync="showSaveDialog"
      class="save-script"
      width="400px"
      @confirm="save"
      @keyupEnter="save"
    >
      <el-form ref="form" label-position="left" label-width="120px" :model="record">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item
              :label="activeTab === functionTab ? $t('script.functionName') : $t('script.schemaName')"
              prop="name"
            >
              <el-input v-model.trim="record.name" size="mini"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </my-dialog>
    <ImportScript
      @finish="handleUpload"
      :title="activeTab === functionTab ? $t('script.importFunction') : $t('script.importSchema')"
      :extension="extension"
      :format="activeTab === functionTab ? functionList : schemaList"
      :visible.sync="showImportScript"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import Editor from '@/components/Editor.vue'
import MyDialog from '@/components/MyDialog.vue'
import useServers from '@/database/useServices'
import ImportScript from '@/components/ImportScript.vue'
import { scriptTest } from '@/utils/scriptTest'

@Component({
  components: {
    Editor,
    MyDialog,
    ImportScript,
  },
})
export default class Script extends Vue {
  @Getter('currentScript') private scriptOption!: ScriptState | null
  @Getter('currentTheme') private theme!: Theme
  // tab change
  private readonly functionTab: 'functionTab' = 'functionTab'
  private readonly schemaTab: 'schemaTab' = 'schemaTab'
  private activeTab: 'functionTab' | 'schemaTab' = this.functionTab
  private activeTabIndex: number = 0
  // script type
  private schemaList: SchemaList[] = [
    { label: 'Protobuf', value: 'protobuf' },
    { label: 'Avro', value: 'avro' },
  ]
  private functionList: FunctionList[] = [{ label: 'JavaScript', value: 'javascript' }]
  // TODO: Because the editor does not support the parsing of the protobuf language, the editor language is temporarily set to javascript.
  private currentSchema: SchemaType = 'protobuf'
  private currentFunction: FunctionType = 'javascript'
  private readonly inputTypeList: PayloadType[] = ['JSON', 'Plaintext', 'Base64', 'Hex']

  get uploadButtonLabel(): string {
    // function tab or schema tab
    switch (this.activeTab) {
      case 'functionTab':
        return this.$t('script.uploadJs') as string

      case 'schemaTab':
        // protobuf or avro
        switch (this.currentSchema) {
          case 'protobuf':
            return this.$t('script.uploadProto') as string

          case 'avro':
            return this.$t('script.uploadAvsc') as string
        }
    }
  }
  // dialog show
  private showSaveDialog: boolean = false
  private showImportScript: boolean = false
  // page temp cache
  private functionEditorValue: string = ''
  private schemaEditorValue: string = ''
  private functionInputValue: string = ''
  private schemaInputValue: string = ''
  private outputValue: string = ''
  private tempOutputValue: string = ''
  private currentScriptId: string = ''
  private tempScriptId: string = ''
  private functionInputType: PayloadType = 'JSON'
  private schemaInputType: PayloadType = 'JSON'
  private functionEditorLang = 'json'
  private schemaEditorLang = 'json'
  // record content
  private protoName: string = ''
  private record: ScriptModel = {
    name: '',
    script: '',
    type: undefined,
  }
  private scripts: ScriptModel[] = []
  // default value
  private readonly defaultFunction = {
    javascript: {
      extension: 'js',
      importFile: this.$t('script.uploadJs'),
      input: JSON.stringify({ msg: 'hello' }, null, 2),
      content: `/**
* @description: default script
* @param {any} value - Payload
* @param {string} msgType - Message type, value is 'received' or 'publish'
* @param {number} index - Index of the message, valid only when script is used in the publish message and timed message is enabled
* @return {any} - Payload after script processing
*/
function handlePayload(value, msgType, index) {
  return value.msg
}

execute(handlePayload)`,
    },
  }
  private readonly defaultSchema = {
    protobuf: {
      extension: 'proto',
      importFile: this.$t('script.uploadProto'),
      input: JSON.stringify({ id: 123, name: 'John Doe' }, null, 2),
      content: `syntax = "proto3";

message Person {
  int32 id = 1;
  string name = 2;
}`,
    },
    avro: {
      extension: 'avsc',
      importFile: this.$t('script.uploadProto'),
      input: JSON.stringify({ id: 123, name: 'John Doe' }, null, 2),
      content: `{
  "type": "record",
  "name": "Person",
  "fields": [
    {"name": "id", "type": "int"},
    {"name": "name", "type": "string"}
  ]
}`,
    },
  }

  @Watch('functionInputType')
  handleFunctionInputTypeChange(val: PayloadType) {
    this.functionEditorLang = val === 'JSON' ? 'json' : 'plaintext'
  }

  @Watch('schemaInputType')
  handleSchemaInputTypeChange(val: PayloadType) {
    this.schemaEditorLang = val === 'JSON' ? 'json' : 'plaintext'
  }

  get inUseScript() {
    return (
      this.scriptOption?.function?.id === this.currentScriptId || this.scriptOption?.schema?.id === this.currentScriptId
    )
  }

  private created() {
    this.functionEditorValue = this.defaultFunction[this.currentFunction].content
    this.schemaEditorValue = this.defaultSchema[this.currentSchema].content
    this.functionInputValue = this.defaultFunction[this.currentFunction].input
    this.schemaInputValue = this.defaultSchema[this.currentSchema].input
    this.loadData()
  }

  private handleTabClick(e: any) {
    if (e.index != this.activeTabIndex) {
      // page data exchange

      ;[this.outputValue, this.tempOutputValue] = [this.tempOutputValue, this.outputValue]
      ;[this.currentScriptId, this.tempScriptId] = [this.tempScriptId, this.currentScriptId]

      this.activeTab = e.name
      this.activeTabIndex = e.index
      this.scripts = []

      this.loadData()
    }
  }

  private handleTest() {
    try {
      if (this.activeTab === this.functionTab) {
        if (this.currentFunction === 'javascript') {
          this.outputValue = scriptTest(
            this.functionEditorValue,
            'javascript',
            this.functionInputValue,
            this.functionInputType,
          )
        }
      } else {
        switch (this.currentSchema) {
          case 'protobuf':
            if (!this.protoName) {
              this.$message.warning(this.$tc('script.mustProtoName'))
              return
            }

            this.outputValue = scriptTest(
              this.schemaEditorValue,
              this.currentSchema,
              this.schemaInputValue,
              this.schemaInputType,
              {
                name: this.protoName,
              },
            )
            break

          case 'avro':
            this.outputValue = scriptTest(
              this.schemaEditorValue,
              this.currentSchema,
              this.schemaInputValue,
              this.schemaInputType,
            )
            break
        }
      }
    } catch (error) {
      this.$message.error((error as Error).toString())
    }
  }

  private async handleSave() {
    if (!this.currentScriptId) {
      this.showSaveDialog = true
    } else {
      const { scriptService } = useServers()
      const currentScript = await scriptService.get(this.currentScriptId)
      if (currentScript) {
        currentScript.script = this.activeTab === this.functionTab ? this.functionEditorValue : this.schemaEditorValue
        const data = { ...currentScript }
        const res = await scriptService.update(this.currentScriptId, data)
        if (res) {
          this.$message.success(this.$tc('common.editSuccess'))
        }
      }
    }
  }

  private addExtension(name: string) {
    let ext
    if (this.activeTab === this.functionTab) {
      ext = '.' + this.defaultFunction[this.currentFunction].extension
    } else {
      ext = '.' + this.defaultSchema[this.currentSchema].extension
    }
    if (!name.endsWith(ext)) {
      name += ext
    }
    return name
  }

  private async save() {
    this.showSaveDialog = false
    if (!this.record.name) {
      this.$message.warning(this.$tc('script.scriptRequired'))
      return
    }
    this.record.id = undefined
    this.record.name = this.addExtension(this.record.name)
    this.record.script = this.activeTab === this.functionTab ? this.functionEditorValue : this.schemaEditorValue
    this.record.type = this.activeTab === this.functionTab ? this.currentFunction : this.currentSchema
    const data = { ...this.record }
    const { scriptService } = useServers()
    const res = await scriptService.create(data)
    if (res && res.id) {
      this.$message.success(this.$tc('common.createSuccess'))
      this.record = {
        id: '',
        name: '',
        script: '',
        type: undefined,
      }
      this.currentScriptId = res.id
      this.loadData()
    }
  }

  private async loadData(): Promise<void> {
    const { scriptService } = useServers()
    let scripts: ScriptModel[] | [] = []
    if (this.activeTab === this.functionTab) {
      scripts = (await scriptService.getAllFunction()) ?? []
      // TODO:add filter by extension (if more function type)
      // but if there's no extension, default is '.js'
      // scripts = script.filter((item) => item.endsWith('.js'))
    } else {
      scripts = (await scriptService.getAllSchema()) ?? []
      scripts = scripts.filter((item) => item.name.endsWith(`.${this.defaultSchema[this.currentSchema].extension}`))
    }
    this.scripts = scripts

    const processScript = (script: ScriptModel, defaultFunction: any, defaultSchema: any) => {
      const isFunctionTab = this.activeTab === this.functionTab
      const defaultObj = isFunctionTab ? defaultFunction : defaultSchema
      const currentObj = script ? script : defaultObj
      return {
        editorValue: currentObj.script || currentObj.content,
        inputValue: defaultObj.input,
      }
    }
    const { editorValue, inputValue } = processScript(
      this.scripts?.[this.scripts.length - 1],
      this.defaultFunction[this.currentFunction],
      this.defaultSchema[this.currentSchema],
    )
    this.currentScriptId = this.scripts.length ? (this.scripts[this.scripts.length - 1].id as string) : ''
    if (this.activeTab === this.functionTab) {
      this.functionEditorValue = editorValue
      this.functionInputValue = inputValue
    } else {
      this.schemaEditorValue = editorValue
      this.schemaInputValue = inputValue
    }
    if (!this.scripts?.length) {
      this.outputValue = ''
    }
  }

  private async handleDelete() {
    const { scriptService } = useServers()
    const currentScript = await scriptService.get(this.currentScriptId)
    if (currentScript) {
      const { name } = currentScript
      const confirmDelete: string = this.$t('common.confirmDelete', { name }) as string
      this.$confirm(confirmDelete, this.$tc('common.warning'), {
        type: 'warning',
      })
        .then(async () => {
          const res: ScriptModel | undefined = await scriptService.delete(this.currentScriptId)
          if (res) {
            this.$message.success(this.$tc('common.deleteSuccess'))
            this.currentScriptId = ''
            this.loadData()
          }
        })
        .catch((error) => {
          this.$log.error(error.toString())
        })
    }
  }

  private handleCreate() {
    this.currentScriptId = ''
    this.record = {
      id: undefined,
      name: '',
      script: '',
      type: undefined,
    }
    this.functionEditorValue = this.defaultFunction[this.currentFunction].content
    this.schemaEditorValue = this.defaultSchema[this.currentSchema].content
    this.functionInputValue = this.defaultFunction[this.currentFunction].input
    this.schemaInputValue = this.defaultSchema[this.currentSchema].input
    this.outputValue = ''
  }

  private async handleScriptChange(id: string) {
    const { scriptService } = useServers()
    let currentScript = await scriptService.get(id)
    if (currentScript) {
      this.currentScriptId = id
      if (this.activeTab === this.functionTab) {
        this.functionEditorValue = currentScript.script
      } else {
        this.schemaEditorValue = currentScript.script
      }
    }
  }

  private handleSchemaChange(schemaType: SchemaType) {
    this.currentSchema = schemaType
    this.loadData()
  }

  get extension() {
    return this.activeTab === this.functionTab
      ? this.defaultFunction[this.currentFunction].extension
      : this.defaultSchema[this.currentSchema].extension
  }

  private async handleUpload(fileInfo: ImportScriptForm) {
    this.showImportScript = false
    if (fileInfo.fileContent && fileInfo.fileName) {
      this.currentScriptId = ''
      this.record.name = fileInfo.fileName
      this.record.script = fileInfo.fileContent
      this.record.type = this.activeTab === this.functionTab ? this.currentFunction : this.currentSchema
      if (this.activeTab == this.functionTab) {
        this.functionEditorValue = this.record.script
      } else {
        this.schemaEditorValue = this.record.script
      }
      this.save()
    }
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.script-view {
  position: relative;
  padding: 0 16px;
  .titlebar {
    .el-badge__content {
      height: 20px;
      position: relative;
      top: 3px;
      margin-left: 5px;
    }
  }
  .script-view-tabs {
    .el-tabs__item {
      color: var(--color-text-title);

      &.is-active {
        color: var(--color-main-green);
      }
    }
  }

  .script-view-header {
    @include flex-space-between;
    margin-bottom: 10px;
    .el-select {
      width: 230px;
      margin-right: 12px;
    }
    .function-select,
    .schema-select {
      width: 105px;
      margin-right: 12px;
    }
    .el-input.is-disabled .el-input__inner {
      background: var(--color-bg-normal);
      color: var(--color-text-default);
      border: 1px solid var(--color-border-default);
    }
    .icon-new {
      position: relative;
      top: 3px;
      font-weight: bold;
    }
    .upload-btn {
      background: var(--color-bg-normal);
      border: 1px solid var(--color-main-green);
      color: var(--color-main-green);
    }
    .save-btn {
      border: 1px solid var(--color-main-green);
      margin-left: 12px;
    }
    .delete-btn {
      margin-left: 12px;
    }
    .delete-btn:not(.is-disabled) {
      color: var(--color-minor-red);
      border-color: var(--color-minor-red);
      background-color: transparent;
    }
  }
  .script-editor {
    background: var(--color-bg-normal);
    border: 1px solid var(--color-border-default);
    padding: 10px 1px 1px 1px;
    border-radius: 4px;
  }
  .script-test-row {
    margin: 12px 0px;
    label {
      display: block;
      margin-bottom: 6px;
    }
    .test-btn {
      float: right;
    }
    .el-textarea.is-disabled .el-textarea__inner {
      background: var(--color-bg-normal);
      color: var(--color-text-default);
      border: 1px solid var(--color-border-default);
    }
  }
  .script-test-input {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
  .script-test-output {
    padding-bottom: 10px;
  }
  @include editor-lang-type;
  .el-tabs__nav-wrap::after {
    background-color: var(--color-border-default);
  }
}
</style>
