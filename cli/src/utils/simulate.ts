import * as fs from 'fs'
import * as path from 'path'

const scenarioFolder = path.join(__dirname, '../scenarios')

const getLocalScenarioList = function (): string[] {
  if (!fs.existsSync(scenarioFolder)) {
    return []
  }
  // Read the files in the scenario folder
  const files = fs
    .readdirSync(scenarioFolder)
    .filter((file) => file.endsWith('.js') && !file.startsWith('.'))
    .map((file) => ({
      name: file.replace('.js', ''),
      birthtime: fs.statSync(path.join(scenarioFolder, file)).birthtime.getTime(),
    }))
    .sort((a, b) => b.birthtime - a.birthtime)
    .map((file) => file.name)
  return files
}

const getScenarioFilePath = function (file: string): string {
  const absoluePath = path.resolve(file)
  if (fs.existsSync(absoluePath)) {
    return absoluePath
  }
  return ''
}

const loadSimulator = function (name?: string, file?: string): Simulator {
  try {
    let filePath = file ? getScenarioFilePath(file) : path.join(scenarioFolder, `${name}.js`)

    if (!filePath) {
      throw new Error(`File not found: ${file || name}`)
    }

    if (file) {
      const fileName = path.basename(filePath)
      name = fileName.replace('.js', '')
      const targetPath = path.join(scenarioFolder, `.tmp_${fileName}`)
      // Copy the file to the scenario folder to use faker dependencies
      fs.copyFileSync(filePath, targetPath)
      filePath = targetPath
    }

    const simulatorModule = require(filePath)

    if (typeof simulatorModule.generator !== 'function') {
      throw new Error('Not a valid simulator module')
    }

    return Object.assign(simulatorModule, {
      // Use module defined name or the file name as the simulator name
      name: simulatorModule.name || name,
      file,
      realFilePath: filePath,
    })
  } catch (err) {
    throw new Error(`Load simulator error: ${err}`)
  }
}

export { getLocalScenarioList, getScenarioFilePath, loadSimulator }
