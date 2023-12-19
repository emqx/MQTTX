<template>
  <el-cascader-panel
    class="preset-prompts-select"
    :options="presetPromptOptions"
    @change="handleChange"
  ></el-cascader-panel>
</template>

<script lang="ts">
import VueI18n from 'vue-i18n'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class PresetPromptSelect extends Vue {
  private presetPromptOptions = [
    {
      value: 'clientCodegen',
      label: this.$tc('common.promptCodegen'),
      children: [
        {
          value: 'javascript',
          label: 'JavaScript',
        },
        {
          value: 'python',
          label: 'Python',
        },
        {
          value: 'java',
          label: 'Java',
        },
        {
          value: 'go',
          label: 'Go',
        },
        {
          value: 'c',
          label: 'C',
        },
        {
          value: 'cpp',
          label: 'C++',
        },
        {
          value: 'csharp',
          label: 'C#',
        },
        {
          value: 'php',
          label: 'PHP',
        },
        {
          value: 'swift',
          label: 'Swift',
        },
        {
          value: 'kotlin',
          label: 'Kotlin',
        },
        {
          value: 'rust',
          label: 'Rust',
        },
        {
          value: 'dart',
          label: 'Dart',
        },
        {
          value: 'erlang',
          label: 'Erlang',
        },
      ],
    },
    {
      value: 'payload',
      label: 'Payload',
      children: [
        {
          value: 'autoFillPayload',
          label: this.$tc('common.genPayload'),
        },
      ],
    },
    {
      value: 'emqx',
      label: 'EMQX',
      children: [
        {
          value: 'installEMQX',
          label: this.$t('common.installEMQX'),
        },
        {
          value: 'emqxRule',
          label: this.$t('common.emqxRule'),
        },
      ],
    },
    {
      value: 'mqtt',
      label: 'MQTT FAQs',
      children: [
        {
          value: 'mqttProtocol',
          label: this.$tc('common.mqttProtocol'),
        },
      ],
    },
    {
      value: 'explain',
      label: this.$t('common.explainer'),
      children: [
        {
          value: 'connectionInfo',
          label: this.$t('common.currentConnectionInfo'),
        },
      ],
    },
  ]
  get presetPromptsMap(): Record<string, string | VueI18n.TranslateResult> {
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
      autoFillPayload: this.$t('common.promptAutoFillPayload'),
      mqttProtocol: this.$t('common.mqttProtocol'),
      installEMQX: this.$t('common.installEMQX'),
      emqxRule: this.$t('common.promptEmqxRule'),
      connectionInfo: this.$t('common.promptCurrentConnectionInfo', ['@connection']),
    }
  }
  private handleChange(vals: string[]) {
    this.$emit('onChange', vals, this.presetPromptsMap)
  }
}
</script>

<style lang="scss">
.preset-prompts-select.el-cascader-panel.is-bordered {
  box-shadow: #0000001a 0px 4px 12px;
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
