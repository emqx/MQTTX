<template>
  <el-cascader-panel
    ref="cascaderPanel"
    class="preset-prompts-select"
    :options="filteredPresetPromptOptions"
    :props="{ expandTrigger: 'hover', emitPath: false }"
    @change="handleChange"
  ></el-cascader-panel>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { PresetPromptMap, PresetPromptOption, PromptOptionDefinition } from '@/types/copilot'
import {
  PROGRAMMING_LANGUAGES,
  HARDWARE_PLATFORMS,
  MOBILE_APPS,
  WEB_APPS,
  PAYLOAD_OPTIONS,
  MQTT_FAQ_OPTIONS,
  EMQX_OPTIONS,
  EXPLAINER_OPTIONS,
  CUSTOM_FUNCTION_OPTIONS,
  PROTOBUF_SCHEMA_OPTIONS,
  AVRO_SCHEMA_OPTIONS,
} from '@/utils/ai/preset'

@Component
export default class PresetPromptSelect extends Vue {
  private langOptions: PresetPromptOption[] = PROGRAMMING_LANGUAGES.map((option) => ({
    value: option.value,
    label: option.labelKey,
  }))

  private hardwareOptions: PresetPromptOption[] = HARDWARE_PLATFORMS.map((option) => ({
    value: option.value,
    label: option.labelKey,
  }))

  private mobileAppsOptions: PresetPromptOption[] = MOBILE_APPS.map((option) => ({
    value: option.value,
    label: option.labelKey,
  }))

  private webAppsOptions: PresetPromptOption[] = WEB_APPS.map((option) => ({
    value: option.value,
    label: option.labelKey,
  }))

  private payloadOptions: PresetPromptOption[] = PAYLOAD_OPTIONS.map((option) => ({
    value: option.value,
    label: this.$tc(`copilot.${option.labelKey}`),
  }))

  private emqxOptions: PresetPromptOption[] = EMQX_OPTIONS.map((option) => ({
    value: option.value,
    label: this.$t(`copilot.${option.labelKey}`),
  }))

  private mqttOptions: PresetPromptOption[] = MQTT_FAQ_OPTIONS.map((option) => ({
    value: option.value,
    label: this.$tc(`copilot.${option.labelKey}`),
  }))

  private explainOptions: PresetPromptOption[] = EXPLAINER_OPTIONS.map((option) => ({
    value: option.value,
    label: this.$t(`copilot.${option.labelKey}`),
  }))

  private customFunctionOptions: PresetPromptOption[] = CUSTOM_FUNCTION_OPTIONS.map((option) => ({
    value: option.value,
    label: this.$t(`copilot.${option.labelKey}`),
  }))

  private schemaOptions: PresetPromptOption[] = [
    {
      value: 'Protobuf',
      label: 'Protobuf',
      children: PROTOBUF_SCHEMA_OPTIONS.map((option) => ({
        value: option.value,
        label: this.$t(`copilot.${option.labelKey}`),
      })),
    },
    {
      value: 'Avro',
      label: 'Avro',
      children: AVRO_SCHEMA_OPTIONS.map((option) => ({
        value: option.value,
        label: this.$t(`copilot.${option.labelKey}`),
      })),
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
    // Create a function to build prompt text from PromptOptionDefinition
    const buildPromptFromOption = (option: PromptOptionDefinition): any => {
      if (typeof option.prompt === 'string') {
        if (option.params && option.params.length > 0) {
          // If there are parameters, apply i18n and pass in parameters
          return this.$t(`copilot.${option.prompt}`, option.params)
        }
        return this.$t(`copilot.${option.prompt}`)
      } else {
        // For objects with system and user prompts
        return {
          system:
            option.params && option.params.length > 0
              ? this.$t(`copilot.${option.prompt.system}`, option.params)
              : this.$t(`copilot.${option.prompt.system}`),
          user: this.$t(`copilot.${option.prompt.user}`),
        }
      }
    }

    // Create a function to map all options to prompts
    const mapOptionsToPrompts = (options: PromptOptionDefinition[]): { [key: string]: any } => {
      return options.reduce((result, option) => {
        result[option.value] = buildPromptFromOption(option)
        return result
      }, {} as { [key: string]: any })
    }

    // Combine all option groups
    const allOptions = [
      ...PROGRAMMING_LANGUAGES,
      ...HARDWARE_PLATFORMS,
      ...MOBILE_APPS,
      ...WEB_APPS,
      ...PAYLOAD_OPTIONS,
      ...MQTT_FAQ_OPTIONS,
      ...EMQX_OPTIONS,
      ...EXPLAINER_OPTIONS,
      ...CUSTOM_FUNCTION_OPTIONS,
      ...PROTOBUF_SCHEMA_OPTIONS,
      ...AVRO_SCHEMA_OPTIONS,
    ]

    return mapOptionsToPrompts(allOptions)
  }

  private handleChange(val: string) {
    this.$emit('onChange', val, this.presetPromptsMap)
  }

  public focusPanel() {
    this.$nextTick(() => {
      const panelComponent = this.$refs.cascaderPanel as Vue
      if (panelComponent && panelComponent.$el instanceof HTMLElement) {
        const firstMenuItem = panelComponent.$el.querySelector(
          '.el-cascader-menu .el-cascader-node:not(.is-disabled)',
        ) as HTMLElement | null

        if (firstMenuItem) {
          firstMenuItem.focus()
        } else {
          panelComponent.$el.focus()
        }
      }
    })
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
