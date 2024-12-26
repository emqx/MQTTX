import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

function monacoEnvironment() {
  // @ts-expect-error Monaco Editor Worker
  globalThis.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      if (['json'].includes(label)) {
        return new JsonWorker()
      }
      if (['css', 'scss', 'less'].includes(label)) {
        return new CssWorker()
      }
      if (['html', 'handlebars', 'razor'].includes(label)) {
        return new HtmlWorker()
      }
      if (['typescript', 'javascript'].includes(label)) {
        return new TsWorker()
      }
      return new EditorWorker()
    },
  }
}

export { monacoEnvironment }
