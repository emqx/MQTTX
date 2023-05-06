import * as fs from 'fs'
import * as path from 'path'

const scenarioFolder = path.join(__dirname, '../scenarios')

const getLocalScenarioList = function (): string[] {
  if (!fs.existsSync(scenarioFolder)) {
    return []
  }
  // Read the files in the Sense folder
  const files = fs.readdirSync(scenarioFolder).sort((a, b) => {
    const statA = fs.statSync(scenarioFolder + '/' + a);
    const statB = fs.statSync(scenarioFolder + '/' + b);
    return statB.birthtime.getTime() - statA.birthtime.getTime();
  });
  return files.filter($ => $.endsWith('.js')).map($ => $.replace('.js', ''))
}

const getScenarioFilePath = function (file: string): string {
  const absoluePath = path.resolve(file)
  if (fs.existsSync(absoluePath)) {
    return absoluePath
  }
  return ''
}

interface ISimulator {
  name: string,
  file: string,
  realFilePath: string,
  version?: string
  description?: string,
  generator: (option: SimulatePubOptions, clientId?: string) => {
    topic?: string,
    message: string | Buffer,
  },
}

const loadSimulator = function (name?: string, file?: string): ISimulator {
  try {
    let filePath = ''
    if (file) {
      filePath = getScenarioFilePath(file)
      if (!filePath) {
        throw new Error(`File not found: ${file}`)
      }
      // Copy file to scenario folder, in order to load it as a module and use faker dependency
      const fileName = path.basename(filePath)
      const targetPath = path.join(scenarioFolder, `.tmp_${fileName}`)
      fs.copyFileSync(filePath, targetPath)
      filePath = targetPath
    } else {
      filePath = path.join(scenarioFolder, `${name}.js`)
    }
    const simulatorModule = require(filePath)
    if (typeof simulatorModule.generator !== 'function') {
      throw new Error('Not a valid simulator module')
    }
    simulatorModule.name = name
    simulatorModule.file = file
    simulatorModule.realFilePath = filePath
    return simulatorModule
  } catch (err) {
    throw new Error(`Load simulator error: ${err}`)
  }
}

export { getLocalScenarioList, getScenarioFilePath, loadSimulator, ISimulator }
