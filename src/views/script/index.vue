<template>
  <div class="script-view rightbar">
    <h1 class="titlebar">
      {{ $t('script.script') }}
    </h1>
    <div class="script-view-tabs">
      <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('script.functionTab')" name="functionTab"></el-tab-pane>
        <el-tab-pane :label="$t('script.schemaTab')" name="schemaTab"></el-tab-pane>
      </el-tabs>
    </div>
    <div class="script-view-header">
      <div>
        <el-select
          class="function-select"
          :value="currentFunction"
          size="mini"
          disabled
          v-if="activeTab == functionTab"
        >
          <el-option v-for="item in functionList" :key="item.value" :value="item.value" :label="item.label"></el-option>
        </el-select>
        <el-select class="schema-select" :value="currentSchema" size="mini" disabled v-else>
          <el-option v-for="item in schemaList" :key="item.value" :value="item.value" :label="item.label"></el-option>
        </el-select>
        <el-select size="mini" v-model="currentScriptId" @change="handleScriptChange">
          <el-option v-for="script in scripts" :key="script.id" :label="script.name" :value="script.id"></el-option>
        </el-select>
        <a v-if="this.currentScriptId" href="javascript:;" @click="handleCreate">
          <i class="iconfont icon-new"></i>
        </a>
      </div>
      <div>
        <el-button class="upload-btn" size="mini" @click="handleUpload">{{
          activeTab === functionTab ? $t('script.uploadJs') : $t('script.uploadProto')
        }}</el-button>
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
        ref="scriptEditor"
        id="script"
        :lang="currentFunction"
        v-model="editorValue"
        lineNumbers="on"
        :lineNumbersMinChars="5"
        renderHighlight="line"
        @qucik-save="handleTest"
      />
      <Editor
        v-if="activeTab === schemaTab"
        ref="scriptEditor"
        id="script"
        :lang="currentSchema"
        :editorTheme="currentSchema"
        :isCustomerLang="true"
        v-model="editorValue"
        lineNumbers="on"
        :lineNumbersMinChars="5"
        renderHighlight="line"
        @qucik-save="handleTest"
      />
    </div>
    <el-row class="script-test-row script-test-input" :gutter="20">
      <el-col :span="18">
        <label>{{ $t('script.input') }}</label>
      </el-col>
      <el-col :span="6">
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
        ref="scriptInput"
        id="script-input"
        :lang="editorLang"
        lineNumbers="on"
        :lineNumbersMinChars="2"
        v-model="inputValue"
      />
    </div>
    <div class="lang-type">
      <el-radio-group v-model="inputType">
        <el-radio
          v-for="item in activeTab === functionTab ? inputTypeList.slice(0, 2) : inputTypeList"
          :key="item"
          :label="item"
          >{{ item }}</el-radio
        >
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

    <my-dialog
      :title="$t('script.selectMessageName')"
      :visible.sync="showProtobufDialog"
      class="save-script"
      width="400px"
      @confirm="handleTestProtobuf"
      @keyupEnter="handleTestProtobuf"
    >
      <el-form ref="form" label-position="left" label-width="120px" :model="record">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="$t('script.protoName')" prop="name">
              <el-input v-model.trim="messageName" size="mini"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </my-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import Editor from '@/components/Editor.vue'
import MyDialog from '@/components/MyDialog.vue'
import useServers from '@/database/useServices'
import { remote } from 'electron'
import { readFileSync } from 'fs'
import path from 'path'
import { scriptTest } from '@/utils/scriptTest'

@Component({
  components: {
    Editor,
    MyDialog,
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
  private schemaList: ScriptList[] = [{ label: 'Protobuf', value: 'protobuf' }]
  private functionList: ScriptList[] = [{ label: 'JavaScript', value: 'javascript' }]
  private currentSchema: SchemaType = 'protobuf'
  private currentFunction: FunctionType = 'javascript'
  private readonly inputTypeList: PayloadType[] = ['JSON', 'Plaintext', 'Base64', 'Hex']
  // dialog show
  private showSaveDialog: boolean = false
  private showProtobufDialog: boolean = false
  // page temp cache
  private editorValue: string = ''
  private tempEditorValue: string = ''
  private inputValue: string = ''
  private tempInputValue: string = ''
  private outputValue: string = ''
  private tempOutputValue: string = ''
  private currentScriptId: string = ''
  private tempScriptId: string = ''
  private inputType: PayloadType = 'JSON'
  private tempInputType: PayloadType = 'JSON'
  private editorLang = 'json'
  // record content
  private messageName: string = ''
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
  }

  @Watch('inputType')
  handleInputTypeChange(val: PayloadType) {
    this.editorLang = val === 'JSON' ? 'json' : 'plaintext'
  }

  get inUseScript() {
    return (
      this.scriptOption?.function?.id === this.currentScriptId || this.scriptOption?.schema?.id === this.currentScriptId
    )
  }

  private created() {
    this.editorValue = this.defaultFunction[this.currentFunction].content
    this.tempEditorValue = this.defaultSchema[this.currentSchema].content
    this.inputValue = this.defaultFunction[this.currentFunction].input
    this.tempInputValue = this.defaultSchema[this.currentSchema].input
    this.loadData(true)
  }

  private handleTabClick(e: any) {
    if (e.index != this.activeTabIndex) {
      // page data exchange
      ;[this.editorValue, this.tempEditorValue] = [this.tempEditorValue, this.editorValue]
      ;[this.inputValue, this.tempInputValue] = [this.tempInputValue, this.inputValue]
      ;[this.inputType, this.tempInputType] = [this.tempInputType, this.inputType]
      ;[this.outputValue, this.tempOutputValue] = [this.tempOutputValue, this.outputValue]
      ;[this.currentScriptId, this.tempScriptId] = [this.tempScriptId, this.currentScriptId]

      this.activeTab = e.name
      this.activeTabIndex = e.index
      this.scripts = []

      this.loadData()
    }
  }

  private async handleTest() {
    if (this.activeTab === this.functionTab) {
      if (this.currentFunction === 'javascript') {
        this.outputValue = await scriptTest(this.editorValue, 'javascript', this.inputValue, this.inputType)
      }
    } else {
      if (this.currentSchema === 'protobuf') {
        this.showProtobufDialog = true
      }
    }
  }

  private async handleTestProtobuf() {
    this.outputValue = await scriptTest(this.editorValue, 'protobuf', this.inputValue, this.inputType, {
      name: this.messageName,
      ctx: this,
    })
    this.showProtobufDialog = false
  }

  private async handleSave() {
    if (!this.currentScriptId) {
      this.showSaveDialog = true
    } else {
      const { scriptService } = useServers()
      const currentScript = await scriptService.get(this.currentScriptId)
      if (currentScript) {
        currentScript.script = this.editorValue
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
    this.record.script = this.editorValue
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

  private async loadData(first: boolean = false): Promise<void> {
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
          // ignore(error)
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
    this.editorValue =
      this.activeTab === this.functionTab
        ? this.defaultFunction[this.currentFunction].content
        : this.defaultSchema[this.currentSchema].content
    this.inputValue =
      this.activeTab === this.functionTab
        ? this.defaultFunction[this.currentFunction].input
        : this.defaultSchema[this.currentSchema].input
    this.outputValue = ''
  }

  private async handleScriptChange(id: string) {
    const { scriptService } = useServers()
    const currentScript = await scriptService.get(id)
    if (currentScript) {
      this.editorValue = currentScript.script
    }
  }

  private async handleUpload() {
    const filePath = remote.dialog.showOpenDialogSync({
      filters:
        this.activeTab === this.functionTab
          ? [
              {
                name: `${this.defaultFunction[this.currentFunction].importFile}`,
                extensions: [this.defaultFunction[this.currentFunction].extension],
              },
            ]
          : [
              {
                name: `${this.defaultSchema[this.currentSchema].importFile}`,
                extensions: [this.defaultSchema[this.currentSchema].extension],
              },
            ],
      properties: ['openFile'],
    })
    if (filePath && filePath[0]) {
      this.currentScriptId = ''
      this.record.name = path.basename(filePath[0])
      this.record.script = readFileSync(filePath[0], 'utf-8')
      this.record.type = this.activeTab === this.functionTab ? this.currentFunction : this.currentSchema
      this.editorValue = this.record.script
      this.handleSave()
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
    .icon-new {
      position: relative;
      top: 3px;
    }
    .save-btn {
      border: 1px solid var(--color-main-green);
    }
    .delete-btn:not(.is-disabled) {
      color: var(--color-minor-red);
      border-color: var(--color-minor-red);
      background-color: transparent;
      margin-left: 12px;
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
  @include editor-lang-type;
}
</style>
