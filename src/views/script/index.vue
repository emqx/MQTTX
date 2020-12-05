<template>
  <div class="script-view rightbar">
    <h1 class="titlebar">{{ $t('script.script') }}</h1>
    <div class="script-view-header">
      <el-select size="mini" v-model="currentScript"></el-select>
      <el-button class="save-btn" type="primary" size="mini">{{ $t('common.save') }}</el-button>
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
        renderHighlight="line"
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
      <Editor ref="scriptInput" id="script-input" :lang="inputType" v-model="inputValue" />
    </div>
    <div class="lang-type">
      <el-radio-group v-model="inputType">
        <el-radio label="json">JSON</el-radio>
        <el-radio label="plaintext">Plaintext</el-radio>
      </el-radio-group>
    </div>
    <el-row class="script-test-row script-test-output" :gutter="20">
      <el-col :span="24">
        <label>{{ $t('script.output') }}</label>
        <el-input v-model="outputValue" type="textarea" rows="4" disabled></el-input>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Editor from '@/components/Editor.vue'
import sandbox from '@/utils/sandbox'

@Component({
  components: {
    Editor,
  },
})
export default class Script extends Vue {
  private scriptValue = `function handlePayload(value) {
  return value.msg
}

execute(handlePayload)`
  private inputValue = JSON.stringify({ msg: 'Hello' }, null, 2)
  private outputValue = ''
  private currentScript = ''
  private inputType: 'json' | 'plaintext' = 'json'

  private handleTestFunc() {
    this.outputValue = sandbox.executeScript(this.inputValue, this.scriptValue, this.inputType)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.script-view {
  position: relative;
  padding: 0 16px;
  .script-view-header {
    @include flex-space-between;
    margin-bottom: 10px;
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
