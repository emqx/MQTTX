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
    protocol: 'mqtt',
    maxReconnectTimes: 10,
  },
}

const VALID_OUTPUT_MODES: Array<ConfigModel['output']> = ['text', 'log']

const VALID_PROTOCOLS: Array<Protocol> = ['mqtt', 'mqtts', 'ws', 'wss']

const RECOMMENDED_PORTS_BY_PROTOCOL: Record<Protocol, number> = {
  mqtt: 1883,
  mqtts: 8883,
  ws: 8083,
  wss: 8084,
}

export {
  USER_HOME_DIR,
  CONFIG_FILE_PATH,
  DEFAULT_CONFIG,
  VALID_OUTPUT_MODES,
  VALID_PROTOCOLS,
  RECOMMENDED_PORTS_BY_PROTOCOL,
}
