import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import YAML from 'js-yaml'
import XMLConvert from 'xml-js'
import CSVConvert from 'csvtojson'
import ExcelConvert from 'xlsx'
import ImportData from '@/components/ImportData.vue'
import * as importExportTypes from '@/utils/importExportTypes'
import * as connectionBackup from '@/utils/connectionBackup'
import samples from '../fixtures/importDataParsers.json'

const nativeRequire = createRequire(path.join(process.cwd(), 'package.json'))
const ts: typeof import('typescript') = nativeRequire('typescript')
const parsers: Record<string, string> = { YAML: 'js-yaml', XML: 'xml-js', CSV: 'csvtojson', Excel: 'xlsx' }
// Keep test dependencies in the entry bundle: mocha-webpack cannot resolve Vue CLI's nested chunk paths.
const parserModules: Record<string, any> = {
  'js-yaml': YAML,
  'xml-js': XMLConvert,
  csvtojson: CSVConvert,
  xlsx: ExcelConvert,
}
const source = fs
  .readFileSync(path.join(process.cwd(), 'src/components/ImportData.vue'), 'utf8')
  .split('<script lang="ts">')[1]
  .split('</script>')[0]
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
    experimentalDecorators: true,
    esModuleInterop: true,
  },
}).outputText

describe('Desktop format-specific import parsers', () => {
  let directory: string

  beforeEach(() => {
    fs.mkdirSync('/tmp/mqttx-import-parsers', { recursive: true })
    directory = fs.mkdtempSync('/tmp/mqttx-import-parsers/spec-')
  })

  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }))

  for (const sample of samples) {
    it(`loads only the chosen parser for ${sample.name} and preserves the original result`, async () => {
      // Isolate component evaluation from other specs that already loaded these packages.
      const loaded: string[] = []
      const isolated = { exports: {} as any }
      const load = (name: string) => {
        if (name in parserModules) {
          loaded.push(name)
          return parserModules[name]
        }
        if (name === '@/utils/importExportTypes') return importExportTypes
        if (name === '@/utils/connectionBackup') return connectionBackup
        if (name === './MyDialog.vue' || name === '@electron/remote') return {}
        if (name === '@/database/useServices') return () => {}
        return nativeRequire(name)
      }
      new Function('require', 'module', 'exports', compiled)(load, isolated, isolated.exports)
      expect(loaded, 'component initialization must not load file parsers').to.deep.equal([])

      const file = path.join(directory, `backup.${sample.extension}`)
      if (sample.name === 'Excel') {
        const xlsx = ExcelConvert
        const workbook = xlsx.utils.book_new()
        // The expected values were captured by running these inputs through the original component.
        const row = samples.find((item) => item.name === 'JSON')!.expected.fileContent[0]
        for (const [index, id] of ['connection', 'second'].entries()) {
          const sheet = xlsx.utils.json_to_sheet(
            [
              {
                ...row,
                id,
                messages: JSON.stringify(row.messages),
                subscriptions: '[]',
                properties: JSON.stringify(row.properties),
                will: 'null',
                createAt: new Date('2024-01-02T03:04:05.000Z'),
              },
            ],
            { dateNF: 'dd/mm/yyyy' },
          )
          xlsx.utils.book_append_sheet(workbook, sheet, `Sheet${index + 1}`)
        }
        xlsx.writeFile(workbook, file)
      } else {
        fs.writeFileSync(file, sample.content!)
      }

      // Exercise both isolated loading and webpack's actual CommonJS/ESM interop, without mounting.
      for (const methods of [isolated.exports.default.options.methods, (ImportData as any).options.methods]) {
        const errors: string[] = []
        const form = {
          ...methods,
          record: { importFormat: sample.format, fileContent: [], fileName: '', filePath: '' },
          $message: { error: (message: string) => errors.push(message) },
          $t: (key: string) => key,
          $tc: (key: string) => key,
        }
        await form.readFilePath(file, sample.extension)
        expect({
          fileContent: JSON.parse(JSON.stringify(form.record.fileContent)),
          fileName: form.record.fileName,
          selected: !!form.record.filePath,
          errors,
          dateCells: form.record.fileContent.map((connection: any) => connection.createAt instanceof Date),
        }).to.deep.equal(sample.expected)
      }
      expect(loaded).to.deep.equal(parsers[sample.format] ? [parsers[sample.format]] : [])
    })
  }
})
