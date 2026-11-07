import fs from 'fs'
import os from 'os'
import path from 'path'
import ts from 'typescript'

// Mocha handles test TypeScript. Only native Worker files need a separate on-disk build.
export function buildCloudTestWorkers(root = process.cwd()): {
  installer: string
  dispose: () => void
} {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-test-workers-'))
  try {
    fs.symlinkSync(
      path.resolve(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    for (const name of [
      ...['installer-worker', 'diagnostics', 'manifest', 'package'].map((name) => `main/cloud/${name}`),
      'utils/cloudErrors',
    ]) {
      const source = path.resolve(root, 'src', name + '.ts')
      const output = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
        fileName: source,
        reportDiagnostics: true,
      })
      const failure = output.diagnostics?.find((item) => item.category === ts.DiagnosticCategory.Error)
      if (failure) throw new Error(ts.flattenDiagnosticMessageText(failure.messageText, '\n'))
      const destination = path.join(directory, name + '.js')
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, output.outputText)
    }
    return {
      installer: path.join(directory, 'main/cloud/installer-worker.js'),
      dispose: () => fs.rmSync(directory, { recursive: true, force: true }),
    }
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true })
    throw error
  }
}
