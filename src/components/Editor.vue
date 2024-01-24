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
  @Model('change', { type: String }) private readonly value!: string

  @Getter('currentTheme') private theme!: Theme
  @Getter('showConnectionList') private showConnectionList!: boolean

  private editor: monaco.editor.IStandaloneCodeEditor | null = null

  @Watch('value')
  private handleValueChanged(val: string) {
    if (this.editor) {
      if (val !== this.editor.getValue()) {
        this.editor.setValue(val)
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
    const thisEditorModel = this.editor.getModel()
    if (!thisEditorModel) return
    const maxLine = thisEditorModel.getLineCount() || 0
    this.editor.revealLine(maxLine)
  }

  public initEditor(): void | boolean {
    // if customer editorTheme is not empty, then init the editor theme
    if (this.isCustomerLang) {
      this.initCustomerLanguages()
    }
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: this.value,
      language: this.lang,
      readOnly: this.disabled,
      wordWrap: this.wordWrap,
      lineHeight: this.lineHeight,
      fontSize: this.fontSize,
      scrollBeyondLastLine: false,
      lineNumbers: this.lineNumbers,
      lineNumbersMinChars: this.lineNumbersMinChars,
      renderLineHighlight: this.renderHighlight,
      matchBrackets: 'near',
      folding: false,
      theme: this.editorTheme || this.getTheme(),
      lightbulb: {
        enabled: false,
      },
      minimap: {
        enabled: false,
      },
      scrollbar: {
        horizontal: this.scrollbarStatus,
        horizontalScrollbarSize: 8,
        vertical: this.scrollbarStatus,
        verticalScrollbarSize: 8,
        useShadows: this.useShadows,
        alwaysConsumeMouseWheel: false,
      },
      smoothScrolling: true,
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
    // Command method
    // tslint:disable-next-line:no-bitwise
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      this.$emit('enter-event', this.value)
    })
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      this.$emit('qucik-save', this.value)
    })
    // Update editor options
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
      const model = this.editor.getModel()
      if (model) {
        model.dispose()
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
