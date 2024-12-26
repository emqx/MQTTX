import type { editor } from 'monaco-editor/esm/vs/editor/editor.api'

export const logEditorRules: editor.ITokenThemeRule[] = [
  { token: 'log-TRACE', foreground: 'a9a9a9', background: '1e1e1e' },
  { token: 'log-DEBUG', foreground: '00aabb', background: '1e1e1e' },
  { token: 'log-INFO', foreground: '6dbb4c', background: '1e1e1e' },
  { token: 'log-WARN', foreground: 'd57f3b', background: '1e1e1e' },
  { token: 'log-ERROR', foreground: 'ff465e', fontStyle: 'bold', background: '1e1e1e' },
  { token: 'log-FATAL', foreground: 'ff0000', fontStyle: 'bold', background: '1e1e1e' },
  { token: 'log-MARK', foreground: 'ffaa00', fontStyle: 'italic', background: '1e1e1e' },
  { token: 'log-date', foreground: '008888', background: '2d2d2d' },
]

export const logEditorLight: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: false,
  rules: logEditorRules,
  colors: {},
}

export const logEditorDark: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: logEditorRules,
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

export const logEditorNight: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: logEditorRules,
  colors: {
    'editor.foreground': '#F8F8F2',
    'editor.background': '#292B33',
    'editor.selectionBackground': '#49483E',
    'editor.lineHighlightBackground': '#3E3D32',
    'editorCursor.foreground': '#F8F8F0',
    'editorWhitespace.foreground': '#3B3A32',
    'editorIndentGuide.activeBackground': '#9D550FB0',
    'editor.selectionHighlightBorder': '#222218',
  },
}
