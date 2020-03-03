<template>
  <div :id="`monaco-${id}`" class="editor-view"></div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Model, Watch } from 'vue-property-decorator'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

@Component
export default class Editor extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ required: true }) public lang!: string

  @Model('change', { type: String }) private readonly value!: string

  private editor: monaco.editor.IStandaloneCodeEditor | null = null

  @Watch('value')
  private handleValueChanged(val: string) {
    if (this.editor) {
      if (val !== this.editor.getValue()) {
        this.editor.setValue(val)
      }
    }
  }

  @Watch('lang')
  private handleLangChanged(val: string) {
    if (this.editor) {
      this.editor.dispose()
      this.initEditor()
    }
  }

  private initEditor(): void | boolean {
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: this.value,
      language: this.lang,
      readOnly: false,
      fontSize: 14,
      scrollBeyondLastLine: false,
      lineNumbersMinChars: 1,
      theme: 'vs',
      minimap: {
        enabled: false,
      },
    }
    // Create
    const id = document.getElementById(`monaco-${this.id}`)
    if (!id) {
      return false
    }
    this.editor = monaco.editor.create(id, defaultOptions)
    // event changed
    this.editor.onDidChangeModelContent((event) => {
      if (this.editor) {
        const value = this.editor.getValue()
        if (value !== this.value) {
          this.$emit('input', value, event)
          this.$emit('change', value, event)
        }
      }
    })
    // Qucik save method
    // this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
    //   this.$emit('qucik-save', this.value)
    // })
    // Update editor options
    const model = this.editor.getModel()
    if (model) {
      model.updateOptions({ tabSize: 2 })
    }
  }
  private editorLayout() {
    if (this.editor) {
      this.editor.layout()
    }
  }
  private mounted() {
    this.initEditor()
  }
  private created() {
    window.onresize = () => {
      this.editorLayout()
    }
  }
  private beforeDestroy() {
    if (this.editor) {
      const model = this.editor.getModel()
      if (model) {
        model.dispose()
      }
      this.editor.dispose()
      this.editor = null
    }
  }
}
</script>


<style lang="scss">
.editor-view {
  height: 100%;
  position: relative;
}
</style>
