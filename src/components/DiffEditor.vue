<template>
  <div :id="`monaco-${id}`" class="editor-view"></div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import EditorDark from '@/assets/scss/theme/editor-dark.json'
import EditorNight from '@/assets/scss/theme/editor-night.json'

@Component
export default class DiffEditor extends Vue {
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
  @Prop({ default: 'off' }) public wordWrap!: 'off' | 'on'
  @Prop({ default: undefined }) public lineHeight!: number
  @Model('change', { type: String }) private readonly originalValue!: string
  @Model('change', { type: String }) private readonly modifiedValue!: string

  @Getter('currentTheme') private theme!: Theme
  @Getter('showConnectionList') private showConnectionList!: boolean

  private diffEditor: monaco.editor.IStandaloneDiffEditor | null = null

  @Watch('originalValue')
  private handleOriginalValueChanged(val: string) {
    if (this.diffEditor) {
      const originalModel = this.diffEditor.getOriginalEditor().getModel()
      if (originalModel && val !== originalModel.getValue()) {
        originalModel.setValue(val)
      }
    }
  }

  @Watch('modifiedValue')
  private handleModifiedValueChanged(val: string) {
    if (this.diffEditor) {
      const modifiedModel = this.diffEditor.getModifiedEditor().getModel()
      if (modifiedModel && val !== modifiedModel.getValue()) {
        modifiedModel.setValue(val)
      }
    }
  }

  @Watch('theme')
  private handleThemeChanged(val: Theme) {
    if (this.diffEditor) {
      const theme = this.editorTheme || this.getTheme()
      this.diffEditor.getOriginalEditor().updateOptions({ theme })
      this.diffEditor.getModifiedEditor().updateOptions({ theme })
    }
  }

  @Watch('lang')
  private handleLangChanged(val: string) {
    if (this.diffEditor) {
      this.diffEditor.dispose()
      this.initDiffEditor()
    }
  }

  @Watch('disabled')
  private handleDisabledChanged(val: string) {
    if (this.diffEditor) {
      this.diffEditor.dispose()
      this.initDiffEditor()
    }
  }

  @Watch('showConnectionList')
  private handleShowConnectionListChanged(val: boolean) {
    setTimeout(() => {
      this.diffEditorLayout()
    }, 500)
  }

  public initDiffEditor(): void | boolean {
    const defaultOptions: monaco.editor.IDiffEditorConstructionOptions = {
      originalEditable: false,
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

    const id = document.getElementById(`monaco-${this.id}`)
    if (!id) {
      return false
    }

    this.diffEditor = monaco.editor.createDiffEditor(id, defaultOptions)

    const originalModel = monaco.editor.createModel(this.originalValue, this.lang)
    const modifiedModel = monaco.editor.createModel(this.modifiedValue, this.lang)
    this.diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    this.diffEditor.getModifiedEditor().updateOptions({ readOnly: this.disabled })

    this.diffEditor.getModifiedEditor().onDidChangeModelContent((event) => {
      if (this.diffEditor) {
        const value = this.diffEditor.getModifiedEditor().getValue()
        if (value !== this.modifiedValue) {
          this.$emit('input', value, event)
          this.$emit('change', value, event)
        }
      }
    })

    this.diffEditor.getModifiedEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      this.$emit('enter-event', this.modifiedValue)
    })
    this.diffEditor.getModifiedEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      this.$emit('qucik-save', this.modifiedValue)
    })

    const model = this.diffEditor.getModifiedEditor().getModel()
    if (model) {
      model.updateOptions({ tabSize: 2 })
    }

    this.diffEditor.getModifiedEditor().onDidFocusEditorText(() => {
      this.$emit('focus')
    })
    this.diffEditor.getModifiedEditor().onDidBlurEditorText(() => {
      this.$emit('blur')
    })

    this.addContextmenuItem()
  }

  public diffEditorLayout() {
    if (this.diffEditor) {
      this.diffEditor.layout()
    }
  }

  private defineTheme() {
    const dark = EditorDark as monaco.editor.IStandaloneThemeData
    const night = EditorNight as monaco.editor.IStandaloneThemeData
    monaco.editor.defineTheme('editor-dark', dark)
    monaco.editor.defineTheme('editor-night', night)
  }

  private addContextmenuItem() {
    if (this.lang === 'json' && this.diffEditor) {
      this.diffEditor.getModifiedEditor().addAction({
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

  public mounted() {
    this.initDiffEditor()
    window.addEventListener('resize', this.diffEditorLayout)
  }

  public created() {
    this.defineTheme()
  }

  public destroyDiffEditor() {
    if (this.diffEditor) {
      const originalModel = this.diffEditor.getOriginalEditor().getModel()
      const modifiedModel = this.diffEditor.getModifiedEditor().getModel()
      if (originalModel) {
        originalModel.dispose()
      }
      if (modifiedModel) {
        modifiedModel.dispose()
      }
      this.diffEditor.dispose()
      this.diffEditor = null
    }
  }

  public beforeDestroy() {
    this.destroyDiffEditor()
    window.removeEventListener('resize', this.diffEditorLayout)
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
