<template>
  <div class="script-view rightbar">
    <h1 class="titlebar">
      {{ $t('script.script') }}
    </h1>
    <div class="script-view-header">
      <div>
        <el-select size="mini" v-model="currentScriptId" @change="handleScriptChange">
          <el-option v-for="script in scripts" :key="script.id" :value="script.id" :label="script.name"></el-option>
        </el-select>
        <a v-if="this.currentScriptId" href="javascript:;" @click="handleCreate">
          <i class="iconfont icon-new"></i>
        </a>
      </div>
      <div>
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
        ref="scriptEditor"
        id="script"
        lang="javascript"
        v-model="scriptValue"
        lineNumbers="on"
        :lineNumbersMinChars="5"
        renderHighlight="line"
        @qucik-save="handleTestFunc"
      />
    </div>
    <el-row class="script-test-row script-test-input" :gutter="20">
      <el-col :span="18">
        <label>{{ $t('script.input') }}</label>
      </el-col>
      <el-col :span="6">
        <el-button class="test-btn" type="outline" size="mini" @click="handleTestFunc">{{
          $t('script.test')
        }}</el-button>
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
        <el-radio label="JSON">JSON</el-radio>
        <el-radio label="Plaintext">Plaintext</el-radio>
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
      :visible.sync="showDialog"
      class="save-script"
      width="400px"
      @confirm="save"
      @keyupEnter="save"
    >
      <el-form ref="form" label-position="left" label-width="120px" :model="record">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="$t('script.scriptName')" prop="name">
              <el-input v-model="record.name" size="mini"></el-input>
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
import sandbox from '@/utils/sandbox'
import useServers from '@/database/useServices'

@Component({
  components: {
    Editor,
    MyDialog,
  },
})
export default class Script extends Vue {
  @Getter('currentScript') private scriptOption!: ScriptState | null
  @Getter('currentTheme') private theme!: Theme

  private scriptValue = ''
  private showDialog = false
  private inputValue = JSON.stringify({ msg: 'hello' }, null, 2)
  private outputValue = ''
  private currentScriptId = ''
  private inputType: PayloadType = 'JSON'
  private editorLang = 'json'
  private record: ScriptModel = {
    name: '',
    script: '',
  }
  private scripts: ScriptModel[] = []
  private readonly defaultScript = `/**
* @description: default script
* @param {any} value - Payload
* @param {string} msgType - Message type, value is 'received' or 'publish'
* @param {number} index - Index of the message, vaild only when script is used in the publish message and timed message is enabled
* @return {any} - Payload after script processing
*/
function handlePayload(value, msgType, index) {
  return value.msg
}

execute(handlePayload)`

  @Watch('inputType')
  handleInputTypeChange(val: PayloadType) {
    this.editorLang = val === 'JSON' ? 'json' : 'plaintext'
  }

  get inUseScript() {
    return this.scriptOption?.content?.id === this.currentScriptId
  }

  private created() {
    this.loadData()
  }

  private handleTestFunc() {
    this.outputValue = sandbox.executeScript(this.scriptValue, this.inputType, this.inputValue, 'publish')
  }

  private async handleSave() {
    if (!this.currentScriptId) {
      this.showDialog = true
    } else {
      const { scriptService } = useServers()
      const currentScript = await scriptService.get(this.currentScriptId)
      if (currentScript) {
        currentScript.script = this.scriptValue
        const data = { ...currentScript }
        const res = await scriptService.update(this.currentScriptId, data)
        if (res) {
          this.$message.success(this.$tc('common.editSuccess'))
        }
      }
    }
  }

  private async save() {
    if (!this.record.name) {
      this.$message.warning(this.$tc('script.scriptRequired'))
      return
    }
    this.record.script = this.scriptValue
    const data = { ...this.record }
    const { scriptService } = useServers()
    const res = await scriptService.create(data)
    if (res) {
      this.$message.success(this.$tc('common.createSuccess'))
      this.showDialog = false
      this.record = {
        id: '',
        name: '',
        script: '',
      }
      this.loadData()
    }
  }

  private async loadData(): Promise<void> {
    const { scriptService } = useServers()
    const scripts: ScriptModel[] | [] = (await scriptService.getAll()) ?? []
    if (!scripts) return
    this.scripts = scripts
    const len = scripts.length
    const _firstScript: ScriptModel = this.scripts[len - 1]
    if (_firstScript && _firstScript.id) {
      this.currentScriptId = _firstScript.id
      this.scriptValue = _firstScript.script
    } else {
      this.currentScriptId = ''
      this.scriptValue = this.defaultScript
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
    this.scriptValue = this.defaultScript
  }

  private async handleScriptChange(id: string) {
    const { scriptService } = useServers()
    const currentScript = await scriptService.get(id)
    if (currentScript) {
      this.scriptValue = currentScript.script
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
    .icon-new {
      position: relative;
      top: 3px;
    }
    .save-btn {
      border: 1px solid var(--color-main-green);
      margin-right: 12px;
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
  @include editor-lang-type;
}
</style>
