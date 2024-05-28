import { readFileSync, existsSync } from 'fs'
import ini from 'ini'
import { CONFIG_FILE_PATH, DEFAULT_CONFIG, VALID_OUTPUT_MODES } from './common'

/**
 * Parses the content of a config file and returns a ConfigModel object.
 * @param content - The content of the config file.
 * @returns The parsed ConfigModel object.
 * @throws Error if the output mode is invalid.
 */
const parseConfigFile = (content: string): ConfigModel => {
  const config = ini.parse(content)
  const output = config.default?.output
  if (output && !VALID_OUTPUT_MODES.includes(output)) {
    throw new Error(`Invalid output mode: ${output}. Valid modes are: ${VALID_OUTPUT_MODES.join(', ')}`)
  }

  return {
    output: config.default?.output || DEFAULT_CONFIG.output,
    mqtt: {
      host: config.mqtt?.host || DEFAULT_CONFIG.mqtt.host,
      port: parseInt(config.mqtt?.port, 10) || DEFAULT_CONFIG.mqtt.port,
      maxReconnectTimes: parseInt(config.mqtt?.max_reconnect_times, 10) || DEFAULT_CONFIG.mqtt.maxReconnectTimes,
      username: config.mqtt?.username || DEFAULT_CONFIG.mqtt.username,
      password: config.mqtt?.password || DEFAULT_CONFIG.mqtt.password,
    },
  }
}

/**
 * Loads the configuration from a file.
 * If the file exists, it reads the content, parses it, and returns the configuration.
 * If the file doesn't exist or there is an error parsing the content, it returns the default configuration.
 *
 * @returns The loaded configuration.
 */
const loadConfig = (): ConfigModel => {
  if (existsSync(CONFIG_FILE_PATH)) {
    const configFileContent = readFileSync(CONFIG_FILE_PATH, 'utf-8')
    try {
      return parseConfigFile(configFileContent)
    } catch (error) {
      console.error((error as Error).message)
      console.error('Invalid configuration file. Using default configuration.')
    }
  }
  return DEFAULT_CONFIG
}

export { loadConfig }
