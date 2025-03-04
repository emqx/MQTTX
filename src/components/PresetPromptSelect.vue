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

@Component
export default class PresetPromptSelect extends Vue {
  private langOptions = [
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

  private hardwareOptions = [
    { value: 'esp32', label: 'ESP32' },
    { value: 'esp8266', label: 'ESP8266' },
    { value: 'arduino', label: 'Arduino' },
    { value: 'raspberryPi', label: 'Raspberry Pi' },
  ]

  private mobileAppsOptions = [
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
    { value: 'reactNative', label: 'React Native' },
    { value: 'flutter', label: 'Flutter' },
  ]

  private webAppsOptions = [
    { value: 'react', label: 'React' },
    { value: 'vuejs', label: 'Vue.js' },
  ]

  private payloadOptions = [
    { value: 'genSimpleIoTPayload', label: this.$tc('common.genSimpleIoTPayload') },
    { value: 'genComplexIoTPayload', label: this.$tc('common.genComplexIoTPayload') },
    { value: 'genConnectedCarPayload', label: this.$tc('common.genConnectedCarPayload') },
    { value: 'genSmartHomePayload', label: this.$tc('common.genSmartHomePayload') },
    { value: 'genIndustrialIoTPayload', label: this.$tc('common.genIndustrialIoTPayload') },
  ]

  private emqxOptions = [
    { value: 'installEMQX', label: this.$t('common.installEMQX') },
    { value: 'emqxRule', label: this.$t('common.emqxRule') },
    { value: 'emqxLogAnalysis', label: this.$t('common.emqxLogAnalysis') },
  ]

  private mqttOptions = [
    { value: 'mqttProtocol', label: this.$tc('common.mqttProtocol') },
    { value: 'mqtt5', label: this.$tc('common.whatIsMQTT5') },
    { value: 'mqttQoS', label: this.$tc('common.mqttQoS') },
    { value: 'mqttRetain', label: this.$tc('common.mqttRetain') },
  ]

  private explainOptions = [
    { value: 'connectionInfo', label: this.$t('common.currentConnectionInfo') },
    { value: 'genTestDoc', label: this.$t('common.genTestDoc') },
  ]

  private customFunctionOptions = [
    { value: 'customRequirementGenerate', label: this.$t('common.customRequirementGenerate') },
    { value: 'simulateWeatherData', label: this.$t('common.simulateWeatherData') },
    { value: 'dynamicCommandSwitch', label: this.$t('common.dynamicCommandSwitch') },
    { value: 'timeFormatProcessing', label: this.$t('common.timeFormatProcessing') },
  ]

  private presetPromptOptions = [
    {
      value: 'clientCodegen',
      label: this.$tc('common.promptCodegen'),
      children: [
        { value: 'lang', label: this.$tc('common.programmingLang'), children: this.langOptions },
        { value: 'hardware', label: this.$tc('common.hardware'), children: this.hardwareOptions },
        { value: 'mobileApps', label: this.$tc('common.mobileApps'), children: this.mobileAppsOptions },
        { value: 'webApps', label: this.$tc('common.webApps'), children: this.webAppsOptions },
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
      label: this.$t('common.customFunction'),
      children: this.customFunctionOptions,
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
      label: this.$t('common.explainer'),
      children: this.explainOptions,
      allowedRoutes: ['/recent_connections'],
    },
  ]

  get filteredPresetPromptOptions() {
    const currentPath = this.$route.path

    return this.presetPromptOptions.filter((option) => {
      if (option.allowedRoutes.includes('all')) {
        return true
      }

      return option.allowedRoutes.some((route) => currentPath.startsWith(route))
    })
  }

  get presetPromptsMap(): Record<string, VueI18n.TranslateResult | Record<'system' | 'user', VueI18n.TranslateResult>> {
    return {
      javascript: this.$t('common.promptProgrammingLanguage', ['JavaScript', '@connection']),
      python: this.$t('common.promptProgrammingLanguage', ['Python', '@connection']),
      java: this.$t('common.promptProgrammingLanguage', ['Java', '@connection']),
      go: this.$t('common.promptProgrammingLanguage', ['Go', '@connection']),
      c: this.$t('common.promptProgrammingLanguage', ['C', '@connection']),
      cpp: this.$t('common.promptProgrammingLanguage', ['C++', '@connection']),
      csharp: this.$t('common.promptProgrammingLanguage', ['C#', '@connection']),
      php: this.$t('common.promptProgrammingLanguage', ['PHP', '@connection']),
      swift: this.$t('common.promptProgrammingLanguage', ['Swift', '@connection']),
      kotlin: this.$t('common.promptProgrammingLanguage', ['Kotlin', '@connection']),
      rust: this.$t('common.promptProgrammingLanguage', ['Rust', '@connection']),
      dart: this.$t('common.promptProgrammingLanguage', ['Dart', '@connection']),
      erlang: this.$t('common.promptProgrammingLanguage', ['Erlang', '@connection']),
      react: this.$t('common.promptProgrammingLanguage', ['React', '@connection']),
      vuejs: this.$t('common.promptProgrammingLanguage', ['Vue.js', '@connection']),
      reactNative: this.$t('common.promptProgrammingLanguage', ['React Native', '@connection']),
      flutter: this.$t('common.promptProgrammingLanguage', ['Flutter', '@connection']),
      esp32: this.$t('common.promptProgrammingLanguage', ['ESP32', '@connection']),
      esp8266: this.$t('common.promptProgrammingLanguage', ['ESP8266', '@connection']),
      arduino: this.$t('common.promptProgrammingLanguage', ['Arduino', '@connection']),
      raspberryPi: this.$t('common.promptProgrammingLanguage', ['Raspberry Pi', '@connection']),
      android: this.$t('common.promptProgrammingLanguage', ['Android', '@connection']),
      ios: this.$t('common.promptProgrammingLanguage', ['iOS', '@connection']),
      genSimpleIoTPayload: `${this.$t('common.promptGenSimpleIoTPayload')}${this.$t('common.genPayloadFormat')}`,
      genComplexIoTPayload: `${this.$t('common.promptGenComplexIoTPayload')}${this.$t('common.genPayloadFormat')}`,
      genConnectedCarPayload: `${this.$t('common.promptGenConnectedCarPayload')}${this.$t('common.genPayloadFormat')}`,
      genSmartHomePayload: `${this.$t('common.promptGenSmartHomePayload')}${this.$t('common.genPayloadFormat')}`,
      genIndustrialIoTPayload: `${this.$t('common.promptGenIndustrialIoTPayload')}${this.$t(
        'common.genPayloadFormat',
      )}`,
      mqttProtocol: this.$t('common.mqttProtocol'),
      mqtt5: this.$t('common.whatIsMQTT5Desc'),
      mqttQoS: this.$t('common.mqttQoSDesc'),
      mqttRetain: this.$t('common.mqttRetainDesc'),
      installEMQX: this.$t('common.installEMQX'),
      emqxRule: this.$t('common.promptEmqxRule'),
      connectionInfo: this.$t('common.promptCurrentConnectionInfo', ['@connection']),
      genTestDoc: this.$t('common.promptGenTestDoc', ['@connection']),
      emqxLogAnalysis: this.$t('common.promptEmqxLogAnalysis'),
      customRequirementGenerate: {
        system: this.$t('common.promptScript'),
        user: this.$t('common.promptScriptCustom'),
      },
      simulateWeatherData: {
        system: this.$t('common.promptScript'),
        user: this.$t('common.simulateWeatherData'),
      },
      dynamicCommandSwitch: {
        system: this.$t('common.promptScript'),
        user: this.$t('common.dynamicCommandSwitch'),
      },
      timeFormatProcessing: {
        system: this.$t('common.promptScript'),
        user: this.$t('common.timeFormatProcessing'),
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
