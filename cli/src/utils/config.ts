import {
  fileExists,
  writeFile,
  readFile,
  processPath,
  stringifyToYamlOrJson,
  parseYamlOrJson,
  isYaml,
} from '../utils/fileUtils'
import logWrapper from './logWrapper'

const defaultPath = `${process.cwd()}/mqttx-cli-config.json`

const mergeConfig = (oldConfig: Config, newConfig: Config) => Object.assign({}, oldConfig, newConfig)

const removeUselessOptions = (
  opts:
    | ConnectOptions
    | PublishOptions
    | SubscribeOptions
    | BenchConnectOptions
    | BenchPublishOptions
    | BenchSubscribeOptions,
) => {
  const { save, config, ...rest } = opts
  return rest
}

const validateConfig = (commandType: CommandType, filePath: string, config: Config) => {
  const data = config[commandType]
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    logWrapper.fail(`No configuration for ${commandType} found in ${filePath}`)
    process.exit(1)
  }
}

const saveConfig = (
  commandType: CommandType,
  opts:
    | ConnectOptions
    | PublishOptions
    | SubscribeOptions
    | BenchConnectOptions
    | BenchPublishOptions
    | BenchSubscribeOptions,
) => {
  try {
    const filePath = processPath(opts.save!, defaultPath)
    let data: Config = {}
    data[commandType] = removeUselessOptions(opts)
    if (fileExists(filePath)) {
      const config: Config = parseYamlOrJson(readFile(filePath).toString(), isYaml(filePath))
      data = mergeConfig(config, data)
    }
    const content = stringifyToYamlOrJson(data, isYaml(filePath))
    writeFile(filePath, content)
    logWrapper.success(`Configurations saved to ${filePath}`)
  } catch (error) {
    const err = error as Error
    logWrapper.fail(err.toString())
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
    const filePath = processPath(savePath, defaultPath)
    if (fileExists(filePath)) {
      const data = readFile(filePath).toString()
      const config = parseYamlOrJson(data, isYaml(filePath))
      validateConfig(commandType, filePath, config)
      return config[commandType]
    } else {
      logWrapper.fail(`Configuration file ${filePath} not found`)
      process.exit(1)
    }
  } catch (error) {
    const err = error as Error
    logWrapper.fail(err.toString())
    process.exit(1)
  }
}

export { saveConfig, loadConfig }

export default saveConfig
