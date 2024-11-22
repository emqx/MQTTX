<script setup lang="ts">
import type { AutocompleteFetchSuggestionsCallback } from 'element-plus'
import type { Settings } from 'mqttx'

const settings = defineModel<Settings>({ required: true })

const { t } = useI18n()
const langOptions = [
  { label: '简体中文', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
  { label: 'Türkçe', value: 'tr' },
  { label: 'Magyar', value: 'hu' },
]
const themeOptions = [
  { label: t('settings.light'), value: 'light' },
  { label: t('settings.dark'), value: 'dark' },
  { label: t('settings.night'), value: 'night' },
]
const logLevelOptions = [
  { label: 'DEBUG', value: 'debug' },
  { label: 'INFO', value: 'info' },
  { label: 'WARN', value: 'warn' },
  { label: 'ERROR', value: 'error' },
]

const AIAPIHostOptions = [
  {
    value: 'https://api.openai.com/v1',
  },
  {
    value: 'https://api.moonshot.cn/v1',
  },
  {
    value: 'https://api.deepseek.com/v1',
  },
]
function queryAIAPIHost(queryString: string, cb: AutocompleteFetchSuggestionsCallback) {
  cb(queryString ? AIAPIHostOptions.filter(item => item.value.includes(queryString)) : AIAPIHostOptions)
}

const showAIModelsSelect = ref(false)
const AImodelsOptions = [
  {
    value: 'OpenAI',
    children: [
      { value: 'gpt-3.5-turbo' },
      { value: 'gpt-3.5-turbo-0125' },
      { value: 'gpt-3.5-turbo-1106' },
      { value: 'gpt-3.5-turbo-16k' },
      { value: 'gpt-4' },
      { value: 'gpt-4-32k' },
      { value: 'gpt-4-0613' },
      { value: 'gpt-4-32k-0613' },
      { value: 'gpt-4-turbo' },
      { value: 'gpt-4o' },
      { value: 'gpt-4o-mini' },
      { value: 'o1-preview' },
      { value: 'o1-mini' },
    ],
  },
  {
    value: 'Moonshot',
    children: [{ value: 'moonshot-v1-8k' }, { value: 'moonshot-v1-32k' }, { value: 'moonshot-v1-128k' }],
  },
  {
    value: 'DeepSeek',
    children: [{ value: 'deepseek-chat' }, { value: 'deepseek-coder' }],
  },
]
</script>

<template>
  <div id="settings-view" class="px-4 pt-4 pb-12 bg-primary min-h-full select-none">
    <div class="mx-auto max-w-screen-lg">
      <h1 class="mb-12 text-lg text-title">
        {{ $t('settings.settings') }}
      </h1>

      <section :class="$style.section">
        <div :class="$style['section-title']">
          {{ $t('settings.general') }}
        </div>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.language') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSelect v-model="settings.currentLang">
              <ElOption v-for="{ label, value } in langOptions" :key="value" :label="label" :value="value" />
            </ElSelect>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.automatically') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.autoCheck"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16" class="flex gap-1">
            <label :class="$style['settings-item__label']">{{ $t('settings.autoResub') }}</label>
            <ElTooltip
              placement="top"
              :effect="settings.currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('settings.autoResubDesc')"
            >
              <div :class="$style.icon">
                <ElIconWarning />
              </div>
            </ElTooltip>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.autoResub"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16" class="flex gap-1">
            <label :class="$style['settings-item__label']">{{ $t('settings.multiTopics') }}</label>
            <ElTooltip
              placement="top"
              :effect="settings.currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('settings.multiTopicsDesc')"
            >
              <div :class="$style.icon">
                <ElIconWarning />
              </div>
            </ElTooltip>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.multiTopics"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.maxReconnectTimes') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElInputNumber
              v-model="settings.maxReconnectTimes"
              :min="1"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />
      </section>

      <section :class="$style.section">
        <div :class="$style['section-title']">
          {{ $t('settings.appearance') }}
        </div>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16" class="flex gap-1">
            <label>{{ $t('settings.syncOsTheme') }}</label>
            <ElTooltip
              placement="top"
              :effect="settings.currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('settings.syncOsThemeDesc')"
            >
              <div :class="$style.icon">
                <ElIconWarning />
              </div>
            </ElTooltip>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.syncOsTheme"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label>{{ $t('settings.theme') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSelect
              v-model="settings.currentTheme"
              :disabled="settings.syncOsTheme"
            >
              <ElOption
                v-for="{ label, value } in themeOptions"
                :key="value"
                :label="label"
                :value="value"
              />
            </ElSelect>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16" class="flex gap-1">
            <label>{{ $t('settings.jsonHighlight') }}</label>
            <ElTooltip
              placement="top"
              :effect="settings.currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
            >
              <template #content>
                <div v-html="$t('settings.jsonHighlightDesc')" />
              </template>
              <div :class="$style.icon">
                <ElIconWarning />
              </div>
            </ElTooltip>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.jsonHighlight"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />
      </section>

      <section :class="$style.section">
        <div :class="$style['section-title']">
          {{ $t('settings.advanced') }}
        </div>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16" class="flex gap-1">
            <label :class="$style['settings-item__label']">{{ $t('log.logLevel') }}</label>
            <ElTooltip
              placement="top"
              :effect="settings.currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('log.logLevelDesc')"
            >
              <div :class="$style.icon">
                <ElIconWarning />
              </div>
            </ElTooltip>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSelect v-model="settings.logLevel">
              <ElOption v-for="{ label, value } in logLevelOptions" :key="value" :label="label" :value="value" />
            </ElSelect>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.dataRecovery') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElButton
              class="w-20"
              type="primary"
            >
              <div class="text-main-white w-4 h-4">
                <ElIconUpload />
              </div>
            </ElButton>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.dataBackup') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElButton
              class="w-20"
              type="primary"
            >
              <div class="text-main-white w-4 h-4">
                <ElIconPrinter />
              </div>
            </ElButton>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.historyCleanup') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElButton
              class="w-20"
              type="danger"
            >
              <div class="text-main-white w-4 h-4">
                <ElIconDelete />
              </div>
            </ElButton>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16" class="flex gap-1">
            <label :class="$style['settings-item__label']">{{ $t('settings.ignoreQoS0Message') }}</label>
            <ElTooltip
              placement="top"
              :effect="settings.currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('settings.ignoreQoS0MessageDesc')"
            >
              <div :class="$style.icon">
                <ElIconWarning />
              </div>
            </ElTooltip>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.ignoreQoS0Message"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />
      </section>

      <section :class="$style.section">
        <div :class="$style['section-title']">
          MQTTX Copilot
        </div>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.enableCopilot') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElSwitch
              v-model="settings.enableCopilot"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">API Host</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElAutocomplete
              v-model.trim="settings.openAIAPIHost"
              type="text"
              clearable
              :fetch-suggestions="queryAIAPIHost"
              :disabled="!settings.enableCopilot"
              placeholder="https://api.openai.com/v1"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">API Key</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElInput
              v-model.trim="settings.openAIAPIKey"
              placeholder="sk-*******"
              type="password"
              show-password
              clearable
              :disabled="!settings.enableCopilot"
            />
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />

        <ElRow type="flex" justify="space-between" align="middle">
          <ElCol :span="16">
            <label :class="$style['settings-item__label']">{{ $t('settings.model') }}</label>
          </ElCol>
          <ElCol :span="8" :class="$style['section-right']">
            <ElInput
              v-model.trim="settings.model"
              placeholder="gpt-4o"
              type="text"
              clearable
              :disabled="!settings.enableCopilot"
              @focus="showAIModelsSelect = true"
              @clear="showAIModelsSelect = true"
              @input="showAIModelsSelect = false"
            />
            <transition name="el-zoom-in-bottom">
              <ElCascaderPanel
                v-if="showAIModelsSelect"
                v-model="settings.model"
                class="ai-models-select"
                :options="AImodelsOptions"
                :props="{ emitPath: false, label: 'value' }"
                @change="showAIModelsSelect = false"
              />
            </transition>
          </ElCol>
        </ElRow>

        <ElDivider :class="$style.hr" />
      </section>
    </div>
  </div>
</template>

<style lang="scss">
#settings-view {
  .el-select {
    --el-select-width: 108px;
    --el-input-text-color: var(--color-text-default);
    --el-text-color-placeholder: var(--color-text-default);
    --el-select-disabled-color: var(--color-text-default);
    .el-select__wrapper {
      box-shadow: none !important;
      background-color: transparent !important;
    }
  }
  .ai-models-select {
    position: absolute;
    bottom: 36px;
    right: 0px;
    box-shadow: #00000014 0px 4px 12px;
    background: var(--color-bg-normal);
    border: 1px solid var(--color-border-default);
    .el-cascader-menu:last-child {
      width: 100%;
    }
    .el-cascader-menu {
      color: var(--color-text-default);
    }
    .el-cascader-menu {
      border-right: 1px solid var(--color-border-default);
      &:last-child {
        border-right: none;
      }
    }
    .el-cascader-node.is-active {
      .el-icon-check.el-cascader-node__prefix {
        color: var(--color-main-green);
      }
    }
    .el-cascader-node:not(.is-disabled):hover,
    .el-cascader-node:not(.is-disabled):focus {
      background-color: transparent;
      color: var(--color-main-green);
    }
  }
}
</style>

<style module>
.section {
  @apply mb-20 last:mb-0;
}

.hr {
  @apply my-4;
}

.icon {
  @apply cursor-pointer text-default text-base font-semibold w-4 h-4;
}

.section-right {
  @apply text-right;
}

.section-title {
  @apply text-light mb-[-5px];
}

.settings-item__label {
  @apply text-title;
}
</style>
