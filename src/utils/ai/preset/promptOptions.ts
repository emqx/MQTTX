/**
 * Preset Prompt Options Definition
 * This file contains all preset prompt options for AI assistant functionality
 */

import { PromptOptionDefinition } from '@/types/copilot'

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
export const PROGRAMMING_LANGUAGES_COMMAND_VALUES = PROGRAMMING_LANGUAGES.map((option) => option.value)

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
export const HARDWARE_PLATFORMS_COMMAND_VALUES = HARDWARE_PLATFORMS.map((option) => option.value)

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
export const MOBILE_APPS_COMMAND_VALUES = MOBILE_APPS.map((option) => option.value)

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
export const WEB_APPS_COMMAND_VALUES = WEB_APPS.map((option) => option.value)

/**
 * Combined array of all code generation command values
 * Includes programming languages, hardware platforms, mobile apps, and web apps
 */
export const ALL_CODE_GENERATION_COMMAND_VALUES = [
  ...PROGRAMMING_LANGUAGES_COMMAND_VALUES,
  ...HARDWARE_PLATFORMS_COMMAND_VALUES,
  ...MOBILE_APPS_COMMAND_VALUES,
  ...WEB_APPS_COMMAND_VALUES,
]

/**
 * Payload options
 */
export const PAYLOAD_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'customPayload',
    labelKey: 'customRequirementGenerate',
    prompt: 'promptCustomPayload',
  },
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
export const PAYLOAD_GENERATION_COMMAND_VALUES = PAYLOAD_OPTIONS.map((option) => option.value)

/**
 * MQTT FAQ options
 */
export const MQTT_FAQ_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'askMQTTFaq',
    labelKey: 'askMQTTFaq',
    prompt: 'promptAskMQTTFaq',
  },
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

export const MQTT_FAQ_COMMAND_VALUES = MQTT_FAQ_OPTIONS.map((option) => option.value)

/**
 * EMQX options
 */
export const EMQX_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'askEMQX',
    labelKey: 'askEMQX',
    prompt: 'promptAskEMQX',
  },
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
export const EMQX_COMMAND_VALUES = EMQX_OPTIONS.map((option) => option.value)

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

export const EXPLAINER_COMMAND_VALUES = EXPLAINER_OPTIONS.map((option) => option.value)

/**
 * Custom function options
 */
export const CUSTOM_FUNCTION_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'customRequirementGenerateFunc',
    labelKey: 'customRequirementGenerate',
    prompt: 'promptCustomFunctionCustomRequirement',
  },
  {
    value: 'simulateWeatherData',
    labelKey: 'simulateWeatherData',
    prompt: 'simulateWeatherData',
  },
  {
    value: 'dynamicCommandSwitch',
    labelKey: 'dynamicCommandSwitch',
    prompt: 'dynamicCommandSwitch',
  },
  {
    value: 'timeFormatProcessing',
    labelKey: 'timeFormatProcessing',
    prompt: 'timeFormatProcessing',
  },
]

export const CUSTOM_FUNCTION_COMMAND_VALUES = CUSTOM_FUNCTION_OPTIONS.map((option) => option.value)

/**
 * Protobuf Schema options
 */
export const PROTOBUF_SCHEMA_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'protobufCustomRequirementGenerateSchema',
    labelKey: 'customRequirementGenerate',
    prompt: 'promptSchemaCustomRequirement',
    params: ['Protobuf'],
  },
  {
    value: 'protobufReportSmartHomeStatus',
    labelKey: 'reportSmartHomeStatus',
    prompt: 'reportSmartHomeStatus',
    params: ['Protobuf'],
  },
  {
    value: 'protobufIndustrialDeviceAlarm',
    labelKey: 'industrialDeviceAlarm',
    prompt: 'industrialDeviceAlarm',
    params: ['Protobuf'],
  },
  {
    value: 'protobufConnectedCarTelemetry',
    labelKey: 'connectedCarTelemetry',
    prompt: 'connectedCarTelemetry',
    params: ['Protobuf'],
  },
  {
    value: 'protobufSmartMeterReadings',
    labelKey: 'smartMeterReadings',
    prompt: 'smartMeterReadings',
    params: ['Protobuf'],
  },
]
export const PROTOBUF_SCHEMA_COMMAND_VALUES = PROTOBUF_SCHEMA_OPTIONS.map((option) => option.value)
/**
 * Avro Schema options
 */
export const AVRO_SCHEMA_OPTIONS: PromptOptionDefinition[] = [
  {
    value: 'avroCustomRequirementGenerateSchema',
    labelKey: 'customRequirementGenerate',
    prompt: 'promptSchemaCustomRequirement',
    params: ['Avro'],
  },
  {
    value: 'avroReportSmartHomeStatus',
    labelKey: 'reportSmartHomeStatus',
    prompt: 'reportSmartHomeStatus',
    params: ['Avro'],
  },
  {
    value: 'avroIndustrialDeviceAlarm',
    labelKey: 'industrialDeviceAlarm',
    prompt: 'industrialDeviceAlarm',
    params: ['Avro'],
  },
  {
    value: 'avroConnectedCarTelemetry',
    labelKey: 'connectedCarTelemetry',
    prompt: 'connectedCarTelemetry',
    params: ['Avro'],
  },
  {
    value: 'avroSmartMeterReadings',
    labelKey: 'smartMeterReadings',
    prompt: 'smartMeterReadings',
    params: ['Avro'],
  },
]

export const AVRO_SCHEMA_COMMAND_VALUES = AVRO_SCHEMA_OPTIONS.map((option) => option.value)

export const ALL_SCHEMA_COMMAND_VALUES = [...PROTOBUF_SCHEMA_COMMAND_VALUES, ...AVRO_SCHEMA_COMMAND_VALUES]
