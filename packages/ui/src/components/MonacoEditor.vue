<script setup lang="ts">
import type { Theme } from 'mqttx'
import { languages } from 'monaco-editor'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { useSettingsStore } from '../stores'

import EditorDark from '../styles/themes/custom/editor-dark'
import EditorNight from '../styles/themes/custom/editor-night'
import { logEditorDark, logEditorLight, logEditorNight } from '../styles/themes/custom/log-themes'

const props = withDefaults(
  defineProps<{
    value?: monaco.editor.IStandaloneEditorConstructionOptions['value']
    language?: monaco.editor.IStandaloneEditorConstructionOptions['language']
    options?: Partial<monaco.editor.IStandaloneEditorConstructionOptions>
  }>(),
  {
    value: '',
    language: 'json',
    options: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update', value: string, event: monaco.editor.IModelContentChangedEvent): void
}>()

const { value, language, options } = toRefs(props)

const editorRef = ref<HTMLElement | null>(null)
// The editor cannot use ref, using ref will cause the editor to completely freeze when calling getValue or setValue
// Issue: https://stackoverflow.com/questions/76050521/editor-stuck-when-using-getvalue-or-setvalue-in-vue3-reference-object
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  lineHeight: 1,
  fontSize: 14,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'off',
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  matchBrackets: 'near',
  folding: false,
  minimap: {
    enabled: false,
  },
  scrollbar: {
    horizontal: 'auto',
    horizontalScrollbarSize: 8,
    vertical: 'auto',
    verticalScrollbarSize: 8,
    useShadows: false,
    alwaysConsumeMouseWheel: false,
  },
  smoothScrolling: true,
}

const { settings } = useSettingsStore()
const editorTheme = computed(() => {
  const themeOptions: Record<Theme, string> = {
    light: 'vs',
    dark: 'editor-dark',
    night: 'editor-night',
  }
  const logThemeOptions: Record<Theme, string> = {
    light: 'editor-log',
    dark: 'editor-log-dark',
    night: 'editor-log-night',
  }
  if (language.value === 'log') {
    return logThemeOptions[settings!.currentTheme]
  }
  return themeOptions[settings!.currentTheme]
})

function defineLogLanguage() {
  monaco.editor.defineTheme('editor-log', logEditorLight)
  monaco.editor.defineTheme('editor-log-dark', logEditorDark)
  monaco.editor.defineTheme('editor-log-night', logEditorNight)
  languages.register({ id: 'log' })
  languages.setMonarchTokensProvider('log', {
    tokenizer: {
      root: [
        [/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/, 'log-date'],
        [/\[TRACE\]/, 'log-TRACE'],
        [/\[DEBUG\]/, 'log-DEBUG'],
        [/\[INFO\]/, 'log-INFO'],
        [/\[WARN\]/, 'log-WARN'],
        [/\[ERROR\]/, 'log-ERROR'],
        [/\[FATAL\]/, 'log-FATAL'],
        [/\[MARK\]/, 'log-MARK'],
      ],
    },
  })
}

function defineDefaultTheme() {
  monaco.editor.defineTheme('editor-dark', EditorDark)
  monaco.editor.defineTheme('editor-night', EditorNight)
}

function initMonacoEditor() {
  editor = monaco.editor.create(editorRef.value!, {
    ...defaultOptions,
    ...options.value,
    value: value.value,
    language: language.value,
    theme: editorTheme.value,
  })

  editor.onDidChangeModelContent((event) => {
    const editorValue = editor!.getValue()
    if (value.value !== editorValue) {
      emit('update', editorValue, event)
    }
  })
}

watch(value, (newValue) => {
  if (editor?.getValue() !== newValue) {
    editor?.setValue(newValue)
  }
})

onMounted(() => {
  defineDefaultTheme()
  defineLogLanguage()
  initMonacoEditor()
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div ref="editorRef" class="h-full w-full" />
</template>
