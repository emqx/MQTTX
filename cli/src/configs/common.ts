import { join } from 'path'
import { homedir } from 'os'

// Path to user's home directory
const USER_HOME_DIR = homedir()

// Path to the config file
const CONFIG_FILE_PATH = join(USER_HOME_DIR, '.mqttx-cli', 'config')

// Default configuration
const DEFAULT_CONFIG: ConfigModel = {
  output: 'text',
  mqtt: {
    host: 'localhost',
    port: 1883,
  },
}

const VALID_OUTPUT_MODES: Array<ConfigModel['output']> = ['text', 'json', 'log']

export { USER_HOME_DIR, CONFIG_FILE_PATH, DEFAULT_CONFIG, VALID_OUTPUT_MODES }
