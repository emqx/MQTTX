import * as fs from 'fs'
import * as path from 'path'
import Table from 'cli-table3'
import { LsOptions } from 'mqttx'

interface Scenario {
  name: string
  description: string
}

async function listScenarios(): Promise<Scenario[]> {
  const scenariosDir = path.join(__dirname, '../scenarios')
  const scenarios: Scenario[] = []
  try {
    const dir = await fs.promises.readdir(scenariosDir)
    for (const file of dir) {
      if (path.extname(file) === '.js') {
        // Use dynamic import
        const scenario = await import(path.join(scenariosDir, file))
        scenarios.push({
          name: scenario.name,
          description: scenario.description,
        })
      }
    }
  } catch (error) {
    console.error(`Error reading scenarios directory: ${error}`)
  }
  return scenarios
}

const ls = async (options: LsOptions) => {
  if (options.scenarios) {
    try {
      const list = await listScenarios()
      // Create a new table
      const table = new Table({
        head: ['Scenario Name', 'Description'],
      })
      // Push each scenario to the table
      list.forEach((scenario) => {
        table.push([scenario.name, scenario.description])
      })
      // Log the usage
      console.log('You can use any of the above scenario names as a parameter to run the scenario.')
      // Log the table
      console.log(table.toString())
    } catch (err) {
      console.log(err)
    }
  }
}

export default ls
