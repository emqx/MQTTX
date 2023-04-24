import * as fs from 'fs'
import * as path from 'path'

const SimulatorFolder = path.join(__dirname, '../simulator');

interface Simulator {
  version?: string
  description?: string,
  generator: Function,
}

const loadSimulator = function (name: string): Simulator {
  try {
    const filePath = path.join(SimulatorFolder, `${name}.js`);
    const simulatorModule = require(filePath);
    if (typeof simulatorModule.generator !== 'function') {
      throw new Error('Not a valid simulator module')
    }
    return simulatorModule;
  } catch (err) {
    throw new Error(`Load simulator error: ${err}`);
  }
}

const getSimulatorList = function (): string[] {
  if (!fs.existsSync(SimulatorFolder)) {
    return []
  }
  // Read the files in the Sense folder
  const files = fs.readdirSync(SimulatorFolder).sort((a, b) => {
    const statA = fs.statSync(SimulatorFolder + '/' + a);
    const statB = fs.statSync(SimulatorFolder + '/' + b);
    return statB.birthtime.getTime() - statA.birthtime.getTime();
  });
  return files.filter($ => $.endsWith('.js')).map($ => $.replace('.js', ''))
}

export { loadSimulator, getSimulatorList }