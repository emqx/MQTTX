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
import ProtobufEditor from '@/assets/scss/theme/custom/protobuf-editor.json'
import ProtobufEditorDark from '@/assets/scss/theme/custom/protobuf-editor-dark.json'
import ProtobufEditorNight from '@/assets/scss/theme/custom/protobuf-editor-night.json'

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

  // init and register customer editor style
  private initCustomerLanguages() {
    this.registerLog()
    this.registerProtobuf()
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

  // register protobuf editor
  private registerProtobuf() {
    monaco.languages.register({ id: 'protobuf' })
    monaco.languages.setMonarchTokensProvider('protobuf', {
      keywords: [
        'import',
        'option',
        'message',
        'package',
        'service',
        'optional',
        'rpc',
        'returns',
        'return',
        'true',
        'false',
      ],
      typeKeywords: [
        'double',
        'float',
        'int32',
        'int64',
        'uint32',
        'uint64',
        'sint32',
        'sint64',
        'fixed32',
        'fixed64',
        'sfixed32',
        'sfixed64',
        'bool',
        'string',
        'bytes',
      ],
      operators: [
        '=',
        '>',
        '<',
        '!',
        '~',
        '?',
        ':',
        '==',
        '<=',
        '>=',
        '!=',
        '&&',
        '||',
        '++',
        '--',
        '+',
        '-',
        '*',
        '/',
        '&',
        '|',
        '^',
        '%',
        '<<',
        '>>',
        '>>>',
        '+=',
        '-=',
        '*=',
        '/=',
        '&=',
        '|=',
        '^=',
        '%=',
        '<<=',
        '>>=',
        '>>>=',
      ],
      symbols: /[=><!~?:&|+\-*\/^%]+/,
      escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
      tokenizer: {
        root: [
          [
            /[a-z_$][\w$]*/,
            {
              cases: {
                '@typeKeywords': 'typeKeyword',
                '@keywords': 'keyword',
                '@default': 'identifier',
              },
            },
          ],
          [/[A-Z][\w\$]*/, 'type.identifier'],
          { include: '@whitespace' },

          // delimiters and operators
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [
            /@symbols/,
            {
              cases: {
                '@operators': 'operator',
                '@default': '',
              },
            },
          ],
          // @ annotations.
          [/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],
          // numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          // delimiter: after number because of .\d floats
          [/[;,.]/, 'delimiter'],
          // strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
          // characters
          [/'[^\\']'/, 'string'],
          [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
          [/'/, 'string.invalid'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'], // nested comment
          ['\\*/', 'comment', '@pop'],
          [/[\/*]/, 'comment'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/@escapes/, 'string.escape'],
          [/\\./, 'string.escape.invalid'],
          [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
        ],
        whitespace: [
          [/[ \t\r\n]+/, 'white'],
          [/\/\*/, 'comment', '@comment'],
          [/\/\/.*$/, 'comment'],
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
    this.initCustomerLanguages()
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
    // log theme
    const log = { ...LogEditor, ...LogEditorRules } as monaco.editor.IStandaloneThemeData
    const logDark = { ...LogEditorDark, ...LogEditorRules } as monaco.editor.IStandaloneThemeData
    const logNight = { ...LogEditorNight, ...LogEditorRules } as monaco.editor.IStandaloneThemeData
    monaco.editor.defineTheme('editor-log', log)
    monaco.editor.defineTheme('editor-log-dark', logDark)
    monaco.editor.defineTheme('editor-log-night', logNight)

    // protobuf theme
    const proto = ProtobufEditor as monaco.editor.IStandaloneThemeData
    const protoDark = ProtobufEditorDark as monaco.editor.IStandaloneThemeData
    const protoNight = ProtobufEditorNight as monaco.editor.IStandaloneThemeData
    monaco.editor.defineTheme('protobuf', proto)
    monaco.editor.defineTheme('protobuf-dark', protoDark)
    monaco.editor.defineTheme('protobuf-night', protoNight)
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
        return this.lang === 'protobuf' ? 'protobuf-dark' : 'editor-dark'
      case 'night':
        return this.lang === 'protobuf' ? 'protobuf-night' : 'editor-night'
      default:
        return this.lang === 'protobuf' ? 'protobuf' : 'vs'
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
