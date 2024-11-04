import type { SimulatePubOptions, Simulator } from 'mqttx'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { faker } from '@faker-js/faker'

const scenarioFolder = path.join(__dirname, '../scenarios')

const getLocalScenarioList = function (): string[] {
  if (!fs.existsSync(scenarioFolder)) {
    return []
  }
  // Read the files in the scenario folder
  const files = fs
    .readdirSync(scenarioFolder)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
      name: file.replace('.js', ''),
      birthtime: fs.statSync(path.join(scenarioFolder, file)).birthtime.getTime(),
    }))
    .sort((a, b) => b.birthtime - a.birthtime)
    .map(file => file.name)
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
    const filePath = file ? getScenarioFilePath(file) : path.join(scenarioFolder, `${name}.js`)

    if (!filePath) {
      throw new Error(`File not found: ${file || name}`)
    }

    if (path.extname(filePath) !== '.js') {
      throw new Error(`Invalid file type: ${filePath}. Only .js files are allowed.`)
    }

    const simulatorModule = require(filePath)

    if (typeof simulatorModule.generator !== 'function') {
      throw new TypeError('Not a valid simulator module')
    }

    // Rewrite generator to auto inject faker
    const generator = (options: SimulatePubOptions) => {
      return simulatorModule.generator(faker, options)
    }

    return {
      ...simulatorModule,
      generator,
      name: simulatorModule.name || name,
      file,
      realFilePath: filePath,
    } as Simulator
  }
  catch (err) {
    throw new Error(`Load simulator error: ${err}`)
  }
}

export { getLocalScenarioList, getScenarioFilePath, loadSimulator }
