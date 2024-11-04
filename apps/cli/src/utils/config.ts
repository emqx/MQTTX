import type {
  BenchConnectOptions,
  BenchPublishOptions,
  BenchSubscribeOptions,
  CommandType,
  Config,
  ConnectOptions,
  PublishOptions,
  SimulatePubOptions,
  SubscribeOptions,
} from 'mqttx'
import * as fs from 'node:fs'
import path from 'node:path'
import YAML from 'js-yaml'
import signale from '../utils/signale'

const defaultPath = `${process.cwd()}/mqttx-cli-config.json`

const fileExists = (filePath: string) => fs.existsSync(filePath)

function writeFile(filePath: string, data: Config) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      fs.writeFileSync(filePath, YAML.dump(data))
    }
    else {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    }
  }
  catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

function readFile(path: string) {
  try {
    const config = fs.readFileSync(path, 'utf-8')
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      return YAML.load(config) as Config
    }
    return JSON.parse(config) as Config
  }
  catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

const mergeConfig = (oldConfig: Config, newConfig: Config) => Object.assign({}, oldConfig, newConfig)

function processPath(savePath: boolean | string) {
  let filePath = ''
  if (savePath === true) {
    filePath = defaultPath
  }
  else if (typeof savePath === 'string') {
    filePath = path.normalize(savePath)
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(filePath)
    }
  }
  return filePath
}

function removeUselessOptions(opts:
  | ConnectOptions
  | PublishOptions
  | SubscribeOptions
  | BenchConnectOptions
  | BenchPublishOptions
  | BenchSubscribeOptions) {
  const { save, config, ...rest } = opts
  return rest
}

function validateConfig(commandType: CommandType, filePath: string, config: Config) {
  const data = config[commandType]
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    signale.error(`No configuration for ${commandType} found in ${filePath}`)
    process.exit(1)
  }
}

function saveConfig(commandType: CommandType, opts:
  | ConnectOptions
  | PublishOptions
  | SubscribeOptions
  | BenchConnectOptions
  | BenchPublishOptions
  | BenchSubscribeOptions) {
  try {
    const filePath = processPath(opts.save!)
    let data: Config = {}
    data[commandType] = removeUselessOptions(opts)
    if (fileExists(filePath)) {
      const config = readFile(filePath)
      data = mergeConfig(config, data)
    }
    writeFile(filePath, data)
    signale.success(`Configurations saved to ${filePath}`)
  }
  catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

function loadConfig(commandType: 'conn', savePath: boolean | string): ConnectOptions
function loadConfig(commandType: 'pub', savePath: boolean | string): PublishOptions
function loadConfig(commandType: 'sub', savePath: boolean | string): SubscribeOptions
function loadConfig(commandType: 'benchConn', savePath: boolean | string): BenchConnectOptions
function loadConfig(commandType: 'benchPub', savePath: boolean | string): BenchPublishOptions
function loadConfig(commandType: 'benchSub', savePath: boolean | string): BenchSubscribeOptions
function loadConfig(commandType: 'simulate', savePath: boolean | string): SimulatePubOptions
function loadConfig(commandType: CommandType, savePath: boolean | string) {
  try {
    const filePath = processPath(savePath)
    if (fileExists(filePath)) {
      const config = readFile(filePath)
      validateConfig(commandType, filePath, config)
      return config[commandType]
    }
    else {
      signale.error(`Configuration file ${filePath} not found`)
      process.exit(1)
    }
  }
  catch (error) {
    signale.error(error)
    process.exit(1)
  }
}

export { loadConfig, saveConfig }

export default saveConfig
