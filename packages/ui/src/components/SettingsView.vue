<script setup lang="ts">
import type { AutocompleteFetchSuggestionsCallback } from 'element-plus'
import type { PlatformType, Settings } from 'mqttx'

const settings = defineModel<Settings>({ required: true })

const platformType = inject<PlatformType>('platformType', 'web')

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
  <ElScrollbar id="settings-view" class="bg-primary min-h-full select-none">
    <div class="px-4 pt-4 pb-12">
      <div class="mx-auto max-w-screen-lg">
        <h1 class="mb-12 text-lg text-title font-semibold">
          {{ $t('settings.settings') }}
        </h1>

        <section class="settings-section">
          <div class="section-title">
            {{ $t('settings.general') }}
          </div>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.language') }}</label>
            </ElCol>
            <ElCol :span="8">
              <ElSelect v-model="settings.currentLang" automatic-dropdown>
                <ElOption v-for="{ label, value } in langOptions" :key="value" :label="label" :value="value" />
              </ElSelect>
            </ElCol>
          </ElRow>

          <ElDivider />

          <template v-if="platformType === 'desktop'">
            <ElRow type="flex" justify="space-between" align="middle">
              <ElCol :span="16">
                <label>{{ $t('settings.automatically') }}</label>
              </ElCol>
              <ElCol :span="8">
                <ElSwitch v-model="settings.autoCheck" />
              </ElCol>
            </ElRow>

            <ElDivider />
          </template>

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16" class="!flex gap-1 items-center">
              <label>{{ $t('settings.autoResub') }}</label>
              <ElTooltip
                placement="top"
                :open-delay="500"
                :content="$t('settings.autoResubDesc')"
              >
                <div class="label-icon">
                  <ElIconWarning />
                </div>
              </ElTooltip>
            </ElCol>
            <ElCol :span="8">
              <ElSwitch v-model="settings.autoResub" />
            </ElCol>
          </ElRow>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16" class="!flex gap-1 items-center">
              <label>{{ $t('settings.multiTopics') }}</label>
              <ElTooltip
                placement="top"

                :open-delay="500"
                :content="$t('settings.multiTopicsDesc')"
              >
                <div class="label-icon">
                  <ElIconWarning />
                </div>
              </ElTooltip>
            </ElCol>
            <ElCol :span="8">
              <ElSwitch v-model="settings.multiTopics" />
            </ElCol>
          </ElRow>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.maxReconnectTimes') }}</label>
            </ElCol>
            <ElCol :span="8">
              <ElInputNumber
                v-model="settings.maxReconnectTimes"
                :min="1"
              />
            </ElCol>
          </ElRow>

          <ElDivider />
        </section>

        <section class="settings-section">
          <div class="section-title">
            {{ $t('settings.appearance') }}
          </div>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16" class="!flex gap-1 items-center">
              <label>{{ $t('settings.syncOsTheme') }}</label>
              <ElTooltip
                placement="top"
                :open-delay="500"
                :content="$t('settings.syncOsThemeDesc')"
              >
                <div class="label-icon">
                  <ElIconWarning />
                </div>
              </ElTooltip>
            </ElCol>
            <ElCol :span="8">
              <ElSwitch v-model="settings.syncOsTheme" />
            </ElCol>
          </ElRow>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.theme') }}</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16" class="!flex gap-1 items-center">
              <label>{{ $t('settings.jsonHighlight') }}</label>
              <ElTooltip
                placement="top"
                :open-delay="500"
              >
                <template #content>
                  <div v-html="$t('settings.jsonHighlightDesc')" />
                </template>
                <div class="label-icon">
                  <ElIconWarning />
                </div>
              </ElTooltip>
            </ElCol>
            <ElCol :span="8">
              <ElSwitch v-model="settings.jsonHighlight" />
            </ElCol>
          </ElRow>

          <ElDivider />
        </section>

        <section v-if="platformType === 'desktop'" class="settings-section">
          <div class="section-title">
            {{ $t('settings.extends') }}
          </div>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16" class="!flex gap-1 items-center">
              <label>MQTTX CLI</label>
              <ElTooltip
                placement="top"
                :open-delay="500"
                :content="$t('settings.installCLITips')"
              >
                <div class="label-icon">
                  <ElIconWarning />
                </div>
              </ElTooltip>
            </ElCol>
            <ElCol :span="8">
              <ElButton
                class="w-20"
                type="primary"
              >
                <div class="text-main-white w-4 h-4">
                  <ElIconDownload />
                </div>
              </ElButton>
            </ElCol>
          </ElRow>

          <ElDivider />
        </section>

        <section class="settings-section">
          <div class="section-title">
            {{ $t('settings.advanced') }}
          </div>

          <ElDivider />

          <template v-if="platformType === 'desktop'">
            <ElRow type="flex" justify="space-between" align="middle">
              <ElCol :span="16" class="!flex gap-1 items-center">
                <label>{{ $t('log.logLevel') }}</label>
                <ElTooltip
                  placement="top"
                  :open-delay="500"
                  :content="$t('log.logLevelDesc')"
                >
                  <div class="label-icon">
                    <ElIconWarning />
                  </div>
                </ElTooltip>
              </ElCol>
              <ElCol :span="8">
                <ElSelect v-model="settings.logLevel">
                  <ElOption v-for="{ label, value } in logLevelOptions" :key="value" :label="label" :value="value" />
                </ElSelect>
              </ElCol>
            </ElRow>

            <ElDivider />
          </template>

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.dataRecovery') }}</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.dataBackup') }}</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.historyCleanup') }}</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16" class="!flex gap-1 items-center">
              <label>{{ $t('settings.ignoreQoS0Message') }}</label>
              <ElTooltip
                placement="top"
                :open-delay="500"
                :content="$t('settings.ignoreQoS0MessageDesc')"
              >
                <div class="label-icon">
                  <ElIconWarning />
                </div>
              </ElTooltip>
            </ElCol>
            <ElCol :span="8">
              <ElSwitch v-model="settings.ignoreQoS0Message" />
            </ElCol>
          </ElRow>

          <ElDivider />
        </section>

        <section class="settings-section">
          <div class="section-title">
            MQTTX Copilot
          </div>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.enableCopilot') }}</label>
            </ElCol>
            <ElCol :span="8">
              <ElSwitch v-model="settings.enableCopilot" />
            </ElCol>
          </ElRow>

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>API Host</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>API Key</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />

          <ElRow type="flex" justify="space-between" align="middle">
            <ElCol :span="16">
              <label>{{ $t('settings.model') }}</label>
            </ElCol>
            <ElCol :span="8">
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

          <ElDivider />
        </section>
      </div>
    </div>
  </ElScrollbar>
</template>

<style lang="scss">
#settings-view {
  .settings-section {
    @apply mb-20 last:mb-0;
    .el-col-16 {
      @apply text-title;
    }
    .el-col-8 {
      @apply text-right;
    }
    .el-divider--horizontal {
      @apply my-4;
    }
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
    .label-icon {
      @apply cursor-pointer text-default text-base font-semibold w-4 h-4;
    }
    .section-title {
      @apply text-light mb-[-5px];
    }
    .ai-models-select {
      background-color: var(--el-bg-color-overlay);
      @apply absolute bottom-9 right-0;
    }
  }
}
</style>
