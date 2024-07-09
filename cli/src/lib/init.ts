import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { select, input, password } from '@inquirer/prompts'
import { CONFIG_FILE_PATH, DEFAULT_CONFIG, RECOMMENDED_PORTS_BY_PROTOCOL, USER_HOME_DIR } from '../configs/common'

/**
 * Generates the content of a configuration INI file based on the provided config object.
 * @param config - The configuration object containing the necessary properties.
 * @returns The generated configuration file content as a string.
 */
const generateConfigContent = (config: ConfigModel): string => {
  let mqttConfig = `host = ${config.mqtt.host}
port = ${config.mqtt.port}
protocol = ${config.mqtt.protocol}
max_reconnect_times = ${config.mqtt.maxReconnectTimes}`

  if (config.mqtt.username) {
    mqttConfig += `\nusername = ${config.mqtt.username}`
  }

  if (config.mqtt.password) {
    mqttConfig += `\npassword = ${config.mqtt.password}`
  }

  return `[default]
output = ${config.output}

[mqtt]
${mqttConfig}`
}

/**
 * Initializes the configuration for MQTTX CLI.
 * Creates or updates the configuration file with the provided values.
 */
async function initConfig(): Promise<void> {
  const output = (await select({
    message: 'Select MQTTX CLI output mode',
    choices: [
      { name: 'Text', value: 'text', description: 'Plain text output' },
      { name: 'Log', value: 'log', description: 'Log style output' },
    ],
    default: DEFAULT_CONFIG.output,
  })) as ConfigModel['output']

  const protocol = (await select({
    message: 'Select the default MQTT protocol',
    choices: [
      { name: 'MQTT', value: 'mqtt' },
      { name: 'MQTTS', value: 'mqtts' },
      { name: 'WS', value: 'ws' },
      { name: 'WSS', value: 'wss' },
    ],
    default: DEFAULT_CONFIG.mqtt.protocol,
  })) as Protocol

  const host = await input({
    message: 'Enter the default MQTT broker host',
    default: DEFAULT_CONFIG.mqtt.host,
  })

  const port = await input({
    message: 'Enter the default MQTT port',
    default: RECOMMENDED_PORTS_BY_PROTOCOL[protocol].toString(),
    validate: (input) => !isNaN(parseInt(input, 10)) || 'Port must be a number',
  })

  const maxReconnectTimes = await input({
    message: 'Enter the maximum reconnect times for MQTT connection',
    default: DEFAULT_CONFIG.mqtt.maxReconnectTimes.toString(),
    validate: (input) => !isNaN(parseInt(input, 10)) || 'Maximum reconnect times must be a number',
  })

  const username = await input({
    message: 'Enter the default username for MQTT connection authentication',
    default: DEFAULT_CONFIG.mqtt.username,
  })

  const passwordAnswer = await password({
    message: 'Enter the default password for MQTT connection authentication',
    mask: true,
  })

  const newConfig: ConfigModel = {
    output,
    mqtt: {
      host,
      port: parseInt(port, 10),
      protocol,
      maxReconnectTimes: parseInt(maxReconnectTimes, 10),
      username,
      password: passwordAnswer,
    },
  }

  try {
    mkdirSync(join(USER_HOME_DIR, '.mqttx-cli'), { recursive: true })
    writeFileSync(CONFIG_FILE_PATH, generateConfigContent(newConfig))
    console.log(`Configuration file created/updated at ${CONFIG_FILE_PATH}`)
  } catch (error) {
    console.error(
      `Unable to create configuration file at ${CONFIG_FILE_PATH}. Please check your permissions and try again.`,
    )
  }
}

export { initConfig }
