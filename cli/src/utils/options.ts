import {
  fileExists,
  writeFile,
  readFile,
  processPath,
  stringifyToYamlOrJson,
  parseYamlOrJson,
  isYaml,
} from './fileUtils'
import logWrapper from './logWrapper'

const defaultPath = `${process.cwd()}/mqttx-cli-options.json`

const mergeOptions = (oldConfig: Options, newConfig: Options) => Object.assign({}, oldConfig, newConfig)

const removeUselessOptions = (
  opts:
    | ConnectOptions
    | PublishOptions
    | SubscribeOptions
    | BenchConnectOptions
    | BenchPublishOptions
    | BenchSubscribeOptions,
) => {
  const { saveOptions, loadOptions, ...rest } = opts
  return rest
}

/**
 * Validates the options for a specific command type.
 * @param commandType - The type of command.
 * @param filePath - The file path.
 * @param config - The options configuration.
 */
const validateOptions = (commandType: CommandType, filePath: string, config: Options) => {
  const data = config[commandType]
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    logWrapper.fail(`No configuration for ${commandType} found in ${filePath}`)
    process.exit(1)
  }
}

/**
 * Handles saving options to a file.
 *
 * @param commandType - The type of command being executed.
 * @param opts - The options to be saved.
 */
const handleSaveOptions = (
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
    const filePath = processPath(opts.saveOptions!, defaultPath)
    let data: Options = {}
    data[commandType] = removeUselessOptions(opts)
    if (fileExists(filePath)) {
      const config: Options = parseYamlOrJson(readFile(filePath).toString(), isYaml(filePath))
      data = mergeOptions(config, data)
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

/**
 * Handles loading options from a configuration file based on the command type.
 * @param commandType - The type of command.
 * @param savePath - The path to the configuration file.
 * @returns The options for the specified command type.
 */
function handleLoadOptions(commandType: 'conn', savePath: boolean | string): ConnectOptions
function handleLoadOptions(commandType: 'pub', savePath: boolean | string): PublishOptions
function handleLoadOptions(commandType: 'sub', savePath: boolean | string): SubscribeOptions
function handleLoadOptions(commandType: 'benchConn', savePath: boolean | string): BenchConnectOptions
function handleLoadOptions(commandType: 'benchPub', savePath: boolean | string): BenchPublishOptions
function handleLoadOptions(commandType: 'benchSub', savePath: boolean | string): BenchSubscribeOptions
function handleLoadOptions(commandType: 'simulate', savePath: boolean | string): SimulatePubOptions
function handleLoadOptions(commandType: CommandType, savePath: boolean | string) {
  try {
    const filePath = processPath(savePath, defaultPath)
    if (fileExists(filePath)) {
      const data = readFile(filePath).toString()
      const config = parseYamlOrJson(data, isYaml(filePath))
      validateOptions(commandType, filePath, config)
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

export { handleSaveOptions, handleLoadOptions }

export default handleSaveOptions
