<template>
  <el-cascader-panel
    class="preset-prompts-select"
    :options="filteredPresetPromptOptions"
    :props="{ expandTrigger: 'hover', emitPath: false }"
    @change="handleChange"
  ></el-cascader-panel>
</template>

<script lang="ts">
import VueI18n from 'vue-i18n'
import { Component, Vue } from 'vue-property-decorator'
import { PresetPromptMap, PresetPromptOption } from '@/types/copilot'

@Component
export default class PresetPromptSelect extends Vue {
  private langOptions: PresetPromptOption[] = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'rust', label: 'Rust' },
    { value: 'dart', label: 'Dart' },
    { value: 'erlang', label: 'Erlang' },
  ]

  private hardwareOptions: PresetPromptOption[] = [
    { value: 'esp32', label: 'ESP32' },
    { value: 'esp8266', label: 'ESP8266' },
    { value: 'arduino', label: 'Arduino' },
    { value: 'raspberryPi', label: 'Raspberry Pi' },
  ]

  private mobileAppsOptions: PresetPromptOption[] = [
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
    { value: 'reactNative', label: 'React Native' },
    { value: 'flutter', label: 'Flutter' },
  ]

  private webAppsOptions: PresetPromptOption[] = [
    { value: 'react', label: 'React' },
    { value: 'vuejs', label: 'Vue.js' },
  ]

  private payloadOptions: PresetPromptOption[] = [
    { value: 'genSimpleIoTPayload', label: this.$tc('copilot.genSimpleIoTPayload') },
    { value: 'genComplexIoTPayload', label: this.$tc('copilot.genComplexIoTPayload') },
    { value: 'genConnectedCarPayload', label: this.$tc('copilot.genConnectedCarPayload') },
    { value: 'genSmartHomePayload', label: this.$tc('copilot.genSmartHomePayload') },
    { value: 'genIndustrialIoTPayload', label: this.$tc('copilot.genIndustrialIoTPayload') },
  ]

  private emqxOptions: PresetPromptOption[] = [
    { value: 'installEMQX', label: this.$t('copilot.installEMQX') },
    { value: 'emqxRule', label: this.$t('copilot.emqxRule') },
    { value: 'emqxLogAnalysis', label: this.$t('copilot.emqxLogAnalysis') },
  ]

  private mqttOptions: PresetPromptOption[] = [
    { value: 'mqttProtocol', label: this.$tc('copilot.mqttProtocol') },
    { value: 'mqtt5', label: this.$tc('copilot.whatIsMQTT5') },
    { value: 'mqttQoS', label: this.$tc('copilot.mqttQoS') },
    { value: 'mqttRetain', label: this.$tc('copilot.mqttRetain') },
  ]

  private explainOptions: PresetPromptOption[] = [
    { value: 'connectionInfo', label: this.$t('copilot.currentConnectionInfo') },
    { value: 'genTestDoc', label: this.$t('copilot.genTestDoc') },
  ]

  private customFunctionOptions: PresetPromptOption[] = [
    { value: 'customRequirementGenerateFunc', label: this.$t('copilot.customRequirementGenerate') },
    { value: 'simulateWeatherData', label: this.$t('copilot.simulateWeatherData') },
    { value: 'dynamicCommandSwitch', label: this.$t('copilot.dynamicCommandSwitch') },
    { value: 'timeFormatProcessing', label: this.$t('copilot.timeFormatProcessing') },
  ]

  private schemaOptions: PresetPromptOption[] = [
    {
      value: 'Protobuf',
      label: 'Protobuf',
      children: [
        { value: 'protobufCustomRequirementGenerateSchema', label: this.$t('copilot.customRequirementGenerate') },
        { value: 'protobufReportSmartHomeStatus', label: this.$t('copilot.reportSmartHomeStatus') },
        { value: 'protobufIndustrialDeviceAlarm', label: this.$t('copilot.industrialDeviceAlarm') },
        { value: 'protobufConnectedCarTelemetry', label: this.$t('copilot.connectedCarTelemetry') },
        { value: 'protobufSmartMeterReadings', label: this.$t('copilot.smartMeterReadings') },
      ],
    },
    {
      value: 'Avro',
      label: 'Avro',
      children: [
        { value: 'avroCustomRequirementGenerateSchema', label: this.$t('copilot.customRequirementGenerate') },
        { value: 'avroReportSmartHomeStatus', label: this.$t('copilot.reportSmartHomeStatus') },
        { value: 'avroIndustrialDeviceAlarm', label: this.$t('copilot.industrialDeviceAlarm') },
        { value: 'avroConnectedCarTelemetry', label: this.$t('copilot.connectedCarTelemetry') },
        { value: 'avroSmartMeterReadings', label: this.$t('copilot.smartMeterReadings') },
      ],
    },
  ]

  private presetPromptOptions: PresetPromptOption[] = [
    {
      value: 'clientCodegen',
      label: this.$tc('copilot.promptCodegen'),
      children: [
        { value: 'lang', label: this.$tc('copilot.programmingLang'), children: this.langOptions },
        { value: 'hardware', label: this.$tc('copilot.hardware'), children: this.hardwareOptions },
        { value: 'mobileApps', label: this.$tc('copilot.mobileApps'), children: this.mobileAppsOptions },
        { value: 'webApps', label: this.$tc('copilot.webApps'), children: this.webAppsOptions },
      ],
      allowedRoutes: ['/recent_connections'],
    },
    {
      value: 'payload',
      label: 'Payload',
      children: this.payloadOptions,
      allowedRoutes: ['/recent_connections'],
    },
    {
      value: 'customFunction',
      label: this.$t('copilot.customFunction'),
      children: this.customFunctionOptions,
      allowedRoutes: ['/script'],
    },
    {
      value: 'schema',
      label: this.$t('copilot.schema'),
      children: this.schemaOptions,
      allowedRoutes: ['/script'],
    },
    {
      value: 'emqx',
      label: 'EMQX',
      children: this.emqxOptions,
      allowedRoutes: ['all'],
    },
    {
      value: 'mqtt',
      label: 'MQTT FAQs',
      children: this.mqttOptions,
      allowedRoutes: ['all'],
    },
    {
      value: 'explain',
      label: this.$t('copilot.explainer'),
      children: this.explainOptions,
      allowedRoutes: ['/recent_connections'],
    },
  ]

  get filteredPresetPromptOptions(): PresetPromptOption[] {
    const currentPath = this.$route.path

    return this.presetPromptOptions.filter((option) => {
      if (option.allowedRoutes?.includes('all')) {
        return true
      }

      return option.allowedRoutes?.some((route) => currentPath.startsWith(route))
    })
  }

  get presetPromptsMap(): PresetPromptMap {
    return {
      javascript: this.$t('copilot.promptProgrammingLanguage', ['JavaScript', '@connection']),
      python: this.$t('copilot.promptProgrammingLanguage', ['Python', '@connection']),
      java: this.$t('copilot.promptProgrammingLanguage', ['Java', '@connection']),
      go: this.$t('copilot.promptProgrammingLanguage', ['Go', '@connection']),
      c: this.$t('copilot.promptProgrammingLanguage', ['C', '@connection']),
      cpp: this.$t('copilot.promptProgrammingLanguage', ['C++', '@connection']),
      csharp: this.$t('copilot.promptProgrammingLanguage', ['C#', '@connection']),
      php: this.$t('copilot.promptProgrammingLanguage', ['PHP', '@connection']),
      swift: this.$t('copilot.promptProgrammingLanguage', ['Swift', '@connection']),
      kotlin: this.$t('copilot.promptProgrammingLanguage', ['Kotlin', '@connection']),
      rust: this.$t('copilot.promptProgrammingLanguage', ['Rust', '@connection']),
      dart: this.$t('copilot.promptProgrammingLanguage', ['Dart', '@connection']),
      erlang: this.$t('copilot.promptProgrammingLanguage', ['Erlang', '@connection']),
      react: this.$t('copilot.promptProgrammingLanguage', ['React', '@connection']),
      vuejs: this.$t('copilot.promptProgrammingLanguage', ['Vue.js', '@connection']),
      reactNative: this.$t('copilot.promptProgrammingLanguage', ['React Native', '@connection']),
      flutter: this.$t('copilot.promptProgrammingLanguage', ['Flutter', '@connection']),
      esp32: this.$t('copilot.promptProgrammingLanguage', ['ESP32', '@connection']),
      esp8266: this.$t('copilot.promptProgrammingLanguage', ['ESP8266', '@connection']),
      arduino: this.$t('copilot.promptProgrammingLanguage', ['Arduino', '@connection']),
      raspberryPi: this.$t('copilot.promptProgrammingLanguage', ['Raspberry Pi', '@connection']),
      android: this.$t('copilot.promptProgrammingLanguage', ['Android', '@connection']),
      ios: this.$t('copilot.promptProgrammingLanguage', ['iOS', '@connection']),
      genSimpleIoTPayload: `${this.$t('copilot.promptGenSimpleIoTPayload')}${this.$t('copilot.genPayloadFormat')}`,
      genComplexIoTPayload: `${this.$t('copilot.promptGenComplexIoTPayload')}${this.$t('copilot.genPayloadFormat')}`,
      genConnectedCarPayload: `${this.$t('copilot.promptGenConnectedCarPayload')}${this.$t(
        'copilot.genPayloadFormat',
      )}`,
      genSmartHomePayload: `${this.$t('copilot.promptGenSmartHomePayload')}${this.$t('copilot.genPayloadFormat')}`,
      genIndustrialIoTPayload: `${this.$t('copilot.promptGenIndustrialIoTPayload')}${this.$t(
        'copilot.genPayloadFormat',
      )}`,
      mqttProtocol: this.$t('copilot.mqttProtocol'),
      mqtt5: this.$t('copilot.whatIsMQTT5Desc'),
      mqttQoS: this.$t('copilot.mqttQoSDesc'),
      mqttRetain: this.$t('copilot.mqttRetainDesc'),
      installEMQX: this.$t('copilot.installEMQX'),
      emqxRule: this.$t('copilot.promptEmqxRule'),
      connectionInfo: this.$t('copilot.promptCurrentConnectionInfo', ['@connection']),
      genTestDoc: this.$t('copilot.promptGenTestDoc', ['@connection']),
      emqxLogAnalysis: this.$t('copilot.promptEmqxLogAnalysis'),
      customRequirementGenerateFunc: {
        system: this.$t('copilot.promptCustomFunction'),
        user: this.$t('copilot.promptCustomFunctionCustomRequirement'),
      },
      simulateWeatherData: {
        system: this.$t('copilot.promptCustomFunction'),
        user: this.$t('copilot.simulateWeatherData'),
      },
      dynamicCommandSwitch: {
        system: this.$t('copilot.promptCustomFunction'),
        user: this.$t('copilot.dynamicCommandSwitch'),
      },
      timeFormatProcessing: {
        system: this.$t('copilot.promptCustomFunction'),
        user: this.$t('copilot.timeFormatProcessing'),
      },
      protobufCustomRequirementGenerateSchema: {
        system: this.$t('copilot.promptSchema', ['Protobuf']),
        user: this.$t('copilot.promptSchemaCustomRequirement'),
      },
      protobufReportSmartHomeStatus: {
        system: this.$t('copilot.promptSchema', ['Protobuf']),
        user: this.$t('copilot.reportSmartHomeStatus'),
      },
      protobufIndustrialDeviceAlarm: {
        system: this.$t('copilot.promptSchema', ['Protobuf']),
        user: this.$t('copilot.industrialDeviceAlarm'),
      },
      protobufConnectedCarTelemetry: {
        system: this.$t('copilot.promptSchema', ['Protobuf']),
        user: this.$t('copilot.connectedCarTelemetry'),
      },
      protobufSmartMeterReadings: {
        system: this.$t('copilot.promptSchema', ['Protobuf']),
        user: this.$t('copilot.smartMeterReadings'),
      },
      avroCustomRequirementGenerateSchema: {
        system: this.$t('copilot.promptSchema', ['Avro']),
        user: this.$t('copilot.promptSchemaCustomRequirement'),
      },
      avroReportSmartHomeStatus: {
        system: this.$t('copilot.promptSchema', ['Avro']),
        user: this.$t('copilot.reportSmartHomeStatus'),
      },
      avroIndustrialDeviceAlarm: {
        system: this.$t('copilot.promptSchema', ['Avro']),
        user: this.$t('copilot.industrialDeviceAlarm'),
      },
      avroConnectedCarTelemetry: {
        system: this.$t('copilot.promptSchema', ['Avro']),
        user: this.$t('copilot.connectedCarTelemetry'),
      },
      avroSmartMeterReadings: {
        system: this.$t('copilot.promptSchema', ['Avro']),
        user: this.$t('copilot.smartMeterReadings'),
      },
    }
  }
  private handleChange(val: string) {
    this.$emit('onChange', val, this.presetPromptsMap)
  }
}
</script>

<style lang="scss">
.preset-prompts-select.el-cascader-panel.is-bordered {
  box-shadow: #00000014 0px 4px 12px;
  background: var(--color-bg-normal);
  position: absolute;
  bottom: 68px;
  border: 1px solid var(--color-border-default);
  .el-cascader-node.in-active-path,
  .el-cascader-node.is-selectable.in-checked-path,
  .el-cascader-node.is-active {
    font-weight: normal;
  }
  .el-cascader-node {
    padding: 0 12px 0 12px;
    .el-cascader-node__label {
      padding: 0;
      padding-right: 30px;
    }
  }
  .el-cascader-menu {
    min-width: auto;
    border-right: 1px solid var(--color-border-default);
    &:last-child {
      border-right: none;
    }
  }
  .el-cascader-menu,
  i {
    color: var(--color-text-default);
  }
  .el-icon-check.el-cascader-node__prefix {
    display: none;
  }
  .el-cascader-node:not(.is-disabled):hover,
  .el-cascader-node:not(.is-disabled):focus {
    background-color: transparent;
    color: var(--color-main-green);
  }
}
</style>
