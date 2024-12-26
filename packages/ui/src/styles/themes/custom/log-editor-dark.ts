import type { editor } from 'monaco-editor/esm/vs/editor/editor.api'

const logEditorDark: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.foreground': '#FFFFFF',
    'editor.background': '#282828',
    'editor.selectionBackground': '#49483E',
    'editor.lineHighlightBackground': '#3E3D32',
    'editorCursor.foreground': '#F8F8F0',
    'editorWhitespace.foreground': '#3B3A32',
    'editorIndentGuide.activeBackground': '#9D550F',
    'editor.selectionHighlightBorder': '#222218',
  },
}

export default logEditorDark
