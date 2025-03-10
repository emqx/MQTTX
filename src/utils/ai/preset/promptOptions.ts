/**
 * Preset Prompt Options Definition
 * This file contains all preset prompt options for AI assistant functionality
 */

/**
 * Type definition for prompt options
 */
export interface PromptOptionDefinition {
  value: string
  labelKey: string
  prompt: string | { system: string; user: string }
  params?: string[]
}

/**
 * Programming language options
 */
export const PROGRAMMING_LANGUAGES: PromptOptionDefinition[] = [
  {
    value: 'javascript',
    labelKey: 'JavaScript',
    prompt: 'promptProgrammingLanguage',
    params: ['JavaScript', '@connection'],
  },
  {
    value: 'python',
    labelKey: 'Python',
    prompt: 'promptProgrammingLanguage',
    params: ['Python', '@connection'],
  },
  {
    value: 'java',
    labelKey: 'Java',
    prompt: 'promptProgrammingLanguage',
    params: ['Java', '@connection'],
  },
  {
    value: 'go',
    labelKey: 'Go',
    prompt: 'promptProgrammingLanguage',
    params: ['Go', '@connection'],
  },
  {
    value: 'c',
    labelKey: 'C',
    prompt: 'promptProgrammingLanguage',
    params: ['C', '@connection'],
  },
  {
    value: 'cpp',
    labelKey: 'C++',
    prompt: 'promptProgrammingLanguage',
    params: ['C++', '@connection'],
  },
  {
    value: 'csharp',
    labelKey: 'C#',
    prompt: 'promptProgrammingLanguage',
    params: ['C#', '@connection'],
  },
  {
    value: 'php',
    labelKey: 'PHP',
    prompt: 'promptProgrammingLanguage',
    params: ['PHP', '@connection'],
  },
  {
    value: 'swift',
    labelKey: 'Swift',
    prompt: 'promptProgrammingLanguage',
    params: ['Swift', '@connection'],
  },
  {
    value: 'kotlin',
    labelKey: 'Kotlin',
    prompt: 'promptProgrammingLanguage',
    params: ['Kotlin', '@connection'],
  },
  {
    value: 'rust',
    labelKey: 'Rust',
    prompt: 'promptProgrammingLanguage',
    params: ['Rust', '@connection'],
  },
  {
    value: 'dart',
    labelKey: 'Dart',
    prompt: 'promptProgrammingLanguage',
    params: ['Dart', '@connection'],
  },
  {
    value: 'erlang',
    labelKey: 'Erlang',
    prompt: 'promptProgrammingLanguage',
    params: ['Erlang', '@connection'],
  },
]

/**
 * Hardware platform options
 */
export const HARDWARE_PLATFORMS: PromptOptionDefinition[] = [
  {
    value: 'esp32',
    labelKey: 'ESP32',
    prompt: 'promptProgrammingLanguage',
    params: ['ESP32', '@connection'],
  },
  {
    value: 'esp8266',
    labelKey: 'ESP8266',
    prompt: 'promptProgrammingLanguage',
    params: ['ESP8266', '@connection'],
  },
  {
    value: 'arduino',
    labelKey: 'Arduino',
    prompt: 'promptProgrammingLanguage',
    params: ['Arduino', '@connection'],
  },
  {
    value: 'raspberryPi',
    labelKey: 'Raspberry Pi',
    prompt: 'promptProgrammingLanguage',
    params: ['Raspberry Pi', '@connection'],
  },
]

/**
 * Mobile app options
 */
export const MOBILE_APPS: PromptOptionDefinition[] = [
  {
    value: 'android',
    labelKey: 'Android',
    prompt: 'promptProgrammingLanguage',
    params: ['Android', '@connection'],
  },
  {
    value: 'ios',
    labelKey: 'iOS',
    prompt: 'promptProgrammingLanguage',
    params: ['iOS', '@connection'],
  },
  {
    value: 'reactNative',
    labelKey: 'React Native',
    prompt: 'promptProgrammingLanguage',
    params: ['React Native', '@connection'],
  },
  {
    value: 'flutter',
    labelKey: 'Flutter',
    prompt: 'promptProgrammingLanguage',
    params: ['Flutter', '@connection'],
  },
]

/**
 * Web app options
 */
export const WEB_APPS: PromptOptionDefinition[] = [
  {
    value: 'react',
    labelKey: 'React',
    prompt: 'promptProgrammingLanguage',
    params: ['React', '@connection'],
  },
  {
    value: 'vuejs',
    labelKey: 'Vue.js',
    prompt: 'promptProgrammingLanguage',
    params: ['Vue.js', '@connection'],
  },
]

/**
 * Payload options
 */
export const PAYLOAD_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'genSimpleIoTPayload',
    labelKey: 'genSimpleIoTPayload',
    prompt: 'promptGenSimpleIoTPayload',
  },
  {
    value: 'genComplexIoTPayload',
    labelKey: 'genComplexIoTPayload',
    prompt: 'promptGenComplexIoTPayload',
  },
  {
    value: 'genConnectedCarPayload',
    labelKey: 'genConnectedCarPayload',
    prompt: 'promptGenConnectedCarPayload',
  },
  {
    value: 'genSmartHomePayload',
    labelKey: 'genSmartHomePayload',
    prompt: 'promptGenSmartHomePayload',
  },
  {
    value: 'genIndustrialIoTPayload',
    labelKey: 'genIndustrialIoTPayload',
    prompt: 'promptGenIndustrialIoTPayload',
  },
]

/**
 * MQTT FAQ options
 */
export const MQTT_FAQ_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'mqttProtocol',
    labelKey: 'mqttProtocol',
    prompt: 'mqttProtocol',
  },
  {
    value: 'mqtt5',
    labelKey: 'whatIsMQTT5',
    prompt: 'whatIsMQTT5Desc',
  },
  {
    value: 'mqttQoS',
    labelKey: 'mqttQoS',
    prompt: 'mqttQoSDesc',
  },
  {
    value: 'mqttRetain',
    labelKey: 'mqttRetain',
    prompt: 'mqttRetainDesc',
  },
]

/**
 * EMQX options
 */
export const EMQX_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'installEMQX',
    labelKey: 'installEMQX',
    prompt: 'installEMQX',
  },
  {
    value: 'emqxRule',
    labelKey: 'emqxRule',
    prompt: 'promptEmqxRule',
  },
  {
    value: 'emqxLogAnalysis',
    labelKey: 'emqxLogAnalysis',
    prompt: 'promptEmqxLogAnalysis',
  },
]

/**
 * Explainer options
 */
export const EXPLAINER_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'connectionInfo',
    labelKey: 'currentConnectionInfo',
    prompt: 'promptCurrentConnectionInfo',
    params: ['@connection'],
  },
  {
    value: 'genTestDoc',
    labelKey: 'genTestDoc',
    prompt: 'promptGenTestDoc',
    params: ['@connection'],
  },
]

/**
 * Custom function options
 */
export const CUSTOM_FUNCTION_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'customRequirementGenerateFunc',
    labelKey: 'customRequirementGenerate',
    prompt: {
      system: 'promptCustomFunction',
      user: 'promptCustomFunctionCustomRequirement',
    },
  },
  {
    value: 'simulateWeatherData',
    labelKey: 'simulateWeatherData',
    prompt: {
      system: 'promptCustomFunction',
      user: 'simulateWeatherData',
    },
  },
  {
    value: 'dynamicCommandSwitch',
    labelKey: 'dynamicCommandSwitch',
    prompt: {
      system: 'promptCustomFunction',
      user: 'dynamicCommandSwitch',
    },
  },
  {
    value: 'timeFormatProcessing',
    labelKey: 'timeFormatProcessing',
    prompt: {
      system: 'promptCustomFunction',
      user: 'timeFormatProcessing',
    },
  },
]

/**
 * Protobuf Schema options
 */
export const PROTOBUF_SCHEMA_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'protobufCustomRequirementGenerateSchema',
    labelKey: 'customRequirementGenerate',
    prompt: {
      system: 'promptSchema',
      user: 'promptSchemaCustomRequirement',
    },
    params: ['Protobuf'],
  },
  {
    value: 'protobufReportSmartHomeStatus',
    labelKey: 'reportSmartHomeStatus',
    prompt: {
      system: 'promptSchema',
      user: 'reportSmartHomeStatus',
    },
    params: ['Protobuf'],
  },
  {
    value: 'protobufIndustrialDeviceAlarm',
    labelKey: 'industrialDeviceAlarm',
    prompt: {
      system: 'promptSchema',
      user: 'industrialDeviceAlarm',
    },
    params: ['Protobuf'],
  },
  {
    value: 'protobufConnectedCarTelemetry',
    labelKey: 'connectedCarTelemetry',
    prompt: {
      system: 'promptSchema',
      user: 'connectedCarTelemetry',
    },
    params: ['Protobuf'],
  },
  {
    value: 'protobufSmartMeterReadings',
    labelKey: 'smartMeterReadings',
    prompt: {
      system: 'promptSchema',
      user: 'smartMeterReadings',
    },
    params: ['Protobuf'],
  },
]

/**
 * Avro Schema options
 */
export const AVRO_SCHEMA_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'avroCustomRequirementGenerateSchema',
    labelKey: 'customRequirementGenerate',
    prompt: {
      system: 'promptSchema',
      user: 'promptSchemaCustomRequirement',
    },
    params: ['Avro'],
  },
  {
    value: 'avroReportSmartHomeStatus',
    labelKey: 'reportSmartHomeStatus',
    prompt: {
      system: 'promptSchema',
      user: 'reportSmartHomeStatus',
    },
    params: ['Avro'],
  },
  {
    value: 'avroIndustrialDeviceAlarm',
    labelKey: 'industrialDeviceAlarm',
    prompt: {
      system: 'promptSchema',
      user: 'industrialDeviceAlarm',
    },
    params: ['Avro'],
  },
  {
    value: 'avroConnectedCarTelemetry',
    labelKey: 'connectedCarTelemetry',
    prompt: {
      system: 'promptSchema',
      user: 'connectedCarTelemetry',
    },
    params: ['Avro'],
  },
  {
    value: 'avroSmartMeterReadings',
    labelKey: 'smartMeterReadings',
    prompt: {
      system: 'promptSchema',
      user: 'smartMeterReadings',
    },
    params: ['Avro'],
  },
]
