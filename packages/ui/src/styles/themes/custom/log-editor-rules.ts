import type { editor } from 'monaco-editor/esm/vs/editor/editor.api'

const logEditorRules: editor.ITokenThemeRule[] = [
  { token: 'custom-trace', foreground: '00aabb' },
  { token: 'custom-debug', foreground: '00aabb' },
  { token: 'custom-info', foreground: '6dbb4c' },
  { token: 'custom-warn', foreground: 'd57f3b' },
  { token: 'custom-error', foreground: 'ff465e', fontStyle: 'bold' },
  { token: 'custom-fatal', foreground: 'ff465e', fontStyle: 'bold' },
  { token: 'custom-date', foreground: '008888' },
]

export default logEditorRules
