<template>
  <div :id="`monaco-${id}`" class="editor-view"></div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import EditorDark from '@/assets/scss/theme/editor-dark.json'
import EditorNight from '@/assets/scss/theme/editor-night.json'
import LogEditor from '@/assets/scss/theme/custom/log-editor.json'
import LogEditorDark from '@/assets/scss/theme/custom/log-editor-dark.json'
import LogEditorNight from '@/assets/scss/theme/custom/log-editor-night.json'
import LogEditorRules from '@/assets/scss/theme/custom/log-editor-rules.json'

@Component
export default class Editor extends Vue {
  @Prop({ required: true }) public id!: string
  @Prop({ required: true }) public lang!: string
  @Prop({ default: 12 }) public fontSize!: number
  @Prop({ default: 'off' }) public lineNumbers!: 'off' | 'on'
  @Prop({ default: 1 }) public lineNumbersMinChars!: number
  @Prop({ default: 'none' }) public renderHighlight!: 'none' | 'line'
  @Prop({ default: 'auto' }) public scrollbarStatus: 'auto' | 'visible' | 'hidden' | undefined
  @Prop({ default: false }) public useShadows!: boolean
  @Prop({ default: false }) public disabled!: boolean
  @Prop({ default: undefined }) public editorTheme!: Theme
  @Prop({ default: false }) public isCustomerLang!: boolean
  @Prop({ default: 'off' }) public wordWrap!: 'off' | 'on'
  @Prop({ default: undefined }) public lineHeight!: number
  @Prop({ default: 'single' }) public mode!: 'single' | 'diff'
  @Prop({ default: '' }) public previousValue!: string
  @Model('change', { type: String }) private readonly value!: string

  @Getter('currentTheme') private theme!: Theme
  @Getter('showConnectionList') private showConnectionList!: boolean

  private editor: monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor | null = null

  @Watch('value')
  private handleValueChanged(val: string) {
    if (this.editor) {
      if (this.mode === 'single') {
        const singleEditor = this.editor as monaco.editor.IStandaloneCodeEditor
        if (val !== singleEditor.getValue()) {
          singleEditor.setValue(val)
        }
      } else {
        const diffEditor = this.editor as monaco.editor.IStandaloneDiffEditor
        const modifiedModel = diffEditor.getModifiedEditor().getModel()
        if (modifiedModel && val !== modifiedModel.getValue()) {
          modifiedModel.setValue(val)
        }
      }
    }
  }

  @Watch('previousValue')
  private handlePreviousValueChanged(val: string) {
    if (this.mode === 'diff') {
      if (this.editor) {
        const diffEditor = this.editor as monaco.editor.IStandaloneDiffEditor
        const originalModel = diffEditor.getOriginalEditor().getModel()
        if (originalModel && val !== originalModel.getValue()) {
          originalModel.setValue(val)
        }
      }
    }
  }

  @Watch('theme')
  private handleThemeChanged(val: Theme) {
    this.editor?.updateOptions({
      theme: this.editorTheme || this.getTheme(),
    })
  }

  @Watch('lang')
  private handleLangChanged(val: string) {
    if (this.editor) {
      this.editor.dispose()
      this.initEditor()
    }
  }

  @Watch('disabled')
  private handleDisabledChanged(val: string) {
    if (this.editor) {
      this.editor.dispose()
      this.initEditor()
    }
  }

  @Watch('showConnectionList')
  private handleShowConnectionListChanged(val: boolean) {
    setTimeout(() => {
      this.editorLayout()
    }, 500)
  }

  // init and register customer editor style
  private initCustomerLanguages() {
    this.registerLog()
  }

  // register log style editor
  private registerLog() {
    monaco.languages.register({ id: 'logLanguage' })
    // set tokens for the logLanguage
    monaco.languages.setMonarchTokensProvider('logLanguage', {
      tokenizer: {
        root: [
          [/\[TRACE\]/i, 'custom-trace'],
          [/\[DEBUG\]/i, 'custom-debug'],
          [/\[INFO\]/i, 'custom-info'],
          [/\[WARN\]/i, 'custom-warn'],
          [/\[ERROR\]/i, 'custom-error'],
          [/\[FATAL\]/i, 'custom-fatal'],
          [/\[[0-9]{4}-[0-9]{2}-[0-9]{2} [a-zA-Z.0-9:]+\]/i, 'custom-date'],
        ],
      },
    })
  }

  public scrollToBottom() {
    if (!this.editor) {
      return
    }
    if (this.mode === 'single') {
      const singleEditor = this.editor as monaco.editor.IStandaloneCodeEditor
      const model = singleEditor.getModel()
      if (model) {
        const maxLine = model.getLineCount() || 0
        singleEditor.revealLine(maxLine)
      }
    } else {
      const diffEditor = this.editor as monaco.editor.IStandaloneDiffEditor
      const modifiedModel = diffEditor.getModifiedEditor().getModel()
      if (modifiedModel) {
        const maxLine = modifiedModel.getLineCount() || 0
        diffEditor.getModifiedEditor().revealLine(maxLine)
      }
    }
  }

  private getBaseOptions() {
    return {
      readOnly: this.disabled,
      wordWrap: this.wordWrap,
      theme: this.editorTheme || this.getTheme(),
      fontSize: this.fontSize,
      lineHeight: this.lineHeight,
      lineNumbers: this.lineNumbers,
      lineNumbersMinChars: this.lineNumbersMinChars,
      renderLineHighlight: this.renderHighlight,
      scrollbar: {
        horizontal: this.scrollbarStatus,
        horizontalScrollbarSize: 8,
        vertical: this.scrollbarStatus,
        verticalScrollbarSize: 8,
        useShadows: this.useShadows,
        alwaysConsumeMouseWheel: false,
      },
      minimap: {
        enabled: false,
      },
      lightbulb: {
        enabled: false,
      },
      smoothScrolling: true,
    }
  }

  public initEditor(): void | boolean {
    // if customer editorTheme is not empty, then init the editor theme
    if (this.isCustomerLang) {
      this.initCustomerLanguages()
    }
    const id = document.getElementById(`monaco-${this.id}`)
    if (!id) {
      return false
    }
    switch (this.mode) {
      case 'diff':
        this.createDiffEditor(id)
        break
      default:
        this.createSingleEditor(id)
        break
    }
  }
  private createSingleEditor(id: HTMLElement) {
    const options: monaco.editor.IStandaloneEditorConstructionOptions = {
      ...this.getBaseOptions(),
      value: this.value,
      language: this.lang,
      scrollBeyondLastLine: false,
      matchBrackets: 'near',
      folding: false,
      lightbulb: { enabled: false },
    }
    this.editor = monaco.editor.create(id, options)
    // event changed
    this.editor.onDidChangeModelContent((event) => {
      if (this.editor) {
        const value = (this.editor as monaco.editor.IStandaloneCodeEditor).getValue()
        if (value !== this.value) {
          this.$emit('input', value, event)
          this.$emit('change', value, event)
        }
      }
    })
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      this.$emit('enter-event', this.value)
    })
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      this.$emit('quick-save', this.value)
    })
    const model = this.editor.getModel()
    if (model) {
      model.updateOptions({ tabSize: 2 })
    }
    this.editor.onDidFocusEditorText(() => {
      this.$emit('focus')
    })
    this.editor.onDidBlurEditorText(() => {
      this.$emit('blur')
    })
    // Add contextmenu item
    this.addContextmenuItem()
  }
  private createDiffEditor(id: HTMLElement) {
    const options: monaco.editor.IDiffEditorConstructionOptions = {
      ...this.getBaseOptions(),
      originalEditable: false,
      scrollBeyondLastLine: false,
      matchBrackets: 'near',
      folding: false,
      lightbulb: { enabled: false },
    }
    this.editor = monaco.editor.createDiffEditor(id, options)
    const originalModel = monaco.editor.createModel(this.previousValue, this.lang)
    const modifiedModel = monaco.editor.createModel(this.value, this.lang)
    this.editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    })
    const gutterOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      lineNumbersMinChars: Math.max(this.lineNumbersMinChars, 3),
      lineDecorationsWidth: 8,
      padding: { top: 8, bottom: 8 },
    }
    this.editor.getOriginalEditor().updateOptions(gutterOptions)
    this.editor.getModifiedEditor().updateOptions(gutterOptions)
    this.editor.getModifiedEditor().updateOptions({ readOnly: this.disabled })
    this.editor.getModifiedEditor().onDidChangeModelContent((event) => {
      if (this.editor) {
        const value = (this.editor as monaco.editor.IStandaloneDiffEditor).getModifiedEditor().getValue()
        if (value !== this.value) {
          this.$emit('input', value, event)
          this.$emit('change', value, event)
        }
      }
    })
  }
  public editorLayout() {
    if (this.editor) {
      this.editor.layout()
    }
  }
  private defineTheme() {
    const dark = EditorDark as monaco.editor.IStandaloneThemeData
    const night = EditorNight as monaco.editor.IStandaloneThemeData
    monaco.editor.defineTheme('editor-dark', dark)
    monaco.editor.defineTheme('editor-night', night)
    if (this.isCustomerLang) {
      // log theme
      const log = { ...LogEditor, ...LogEditorRules } as monaco.editor.IStandaloneThemeData
      const logDark = { ...LogEditorDark, ...LogEditorRules } as monaco.editor.IStandaloneThemeData
      const logNight = { ...LogEditorNight, ...LogEditorRules } as monaco.editor.IStandaloneThemeData
      monaco.editor.defineTheme('editor-log', log)
      monaco.editor.defineTheme('editor-log-dark', logDark)
      monaco.editor.defineTheme('editor-log-night', logNight)
    }
  }
  private addContextmenuItem() {
    if (this.lang === 'json' && this.editor) {
      this.editor.addAction({
        id: 'beautifyFormat',
        label: 'Beautify format',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_B],
        contextMenuGroupId: '9_cutcopypaste',
        run: () => {
          this.$emit('format')
        },
      })
    }
  }
  private getTheme(): string {
    switch (this.theme) {
      case 'dark':
        return 'editor-dark'
      case 'night':
        return 'editor-night'
      default:
        return 'vs'
    }
  }

  private mounted() {
    this.initEditor()
    window.addEventListener('resize', this.editorLayout)
  }

  private created() {
    this.defineTheme()
  }

  public destroyEditor() {
    if (this.editor) {
      if (this.mode === 'diff') {
        const diffEditor = this.editor as monaco.editor.IStandaloneDiffEditor
        const originalModel = diffEditor.getOriginalEditor().getModel()
        const modifiedModel = diffEditor.getModifiedEditor().getModel()
        if (originalModel) {
          originalModel.dispose()
        }
        if (modifiedModel) {
          modifiedModel.dispose()
        }
      } else {
        const singleEditor = this.editor as monaco.editor.IStandaloneCodeEditor
        const model = singleEditor.getModel()
        if (model) {
          model.dispose()
        }
      }
      this.editor.dispose()
      this.editor = null
    }
  }

  private beforeDestroy() {
    this.destroyEditor()
    window.removeEventListener('resize', this.editorLayout)
  }
}
</script>

<style lang="scss">
.editor-view {
  height: 100%;
  width: 100%;
  position: relative;
}
.decorationsOverviewRuler {
  display: none;
}
</style>
