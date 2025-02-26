<template>
  <div class="settings-view rightbar">
    <h1 class="titlebar">{{ $t('settings.settings') }}</h1>
    <div class="settings-general">
      <div class="settings-title">{{ $t('settings.general') }}</div>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.language') }}</label>
        </el-col>
        <el-col :span="4">
          <el-select
            class="settings-options"
            :value="currentLang"
            size="mini"
            @change="handleSelectChange('lang', $event)"
          >
            <el-option v-for="(lang, index) in langOptions" :key="index" :label="lang.label" :value="lang.value">
            </el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between">
        <el-col :span="20">
          <label>{{ $t('settings.automatically') }}</label>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="autoCheck"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleAutoCheckSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between">
        <el-col :span="20">
          <label>{{ $t('settings.autoResub') }}</label>
          <el-tooltip
            placement="top"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('settings.autoResubDesc')"
          >
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="autoResub"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleAutoResubSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between">
        <el-col :span="20">
          <label>{{ $t('settings.multiTopics') }}</label>
          <el-tooltip
            placement="top"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('settings.multiTopicsDesc')"
          >
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="multiTopics"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleMultiTopicsSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.maxReconnectTimes') }}</label>
        </el-col>
        <el-col :span="4">
          <el-input-number size="mini" :value="maxReconnectTimes" :min="1" @change="handleInputChanged">
          </el-input-number>
        </el-col>
      </el-row>

      <el-divider></el-divider>
    </div>

    <div class="settings-appearance">
      <div class="settings-title">{{ $t('settings.appearance') }}</div>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between">
        <el-col :span="20">
          <label>{{ $t('settings.syncOsTheme') }}</label>
          <el-tooltip
            placement="top"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('settings.syncOsThemeDesc')"
          >
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="syncOsTheme"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleSyncOsThemeSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.theme') }}</label>
        </el-col>
        <el-col :span="4">
          <el-select
            class="settings-options"
            :value="currentTheme"
            size="mini"
            :disabled="syncOsTheme"
            @change="handleSelectChange('theme', $event)"
          >
            <el-option
              v-for="(theme, index) in themeOptions"
              :key="index"
              :label="$t(`settings.${theme.value}`)"
              :value="theme.value"
            >
            </el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between">
        <el-col :span="20">
          <label>{{ $t('settings.jsonHighlight') }}</label>
          <el-tooltip placement="top" :effect="currentTheme !== 'light' ? 'light' : 'dark'" :open-delay="500">
            <div slot="content" v-html="$t('settings.jsonHighlightDesc')"></div>
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="jsonHighlight"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleJsonHighlightSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>

      <el-divider></el-divider>
    </div>

    <div class="settings-advanced">
      <div class="settings-title">{{ $t('settings.extends') }}</div>
      <el-divider></el-divider>
      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>MQTTX CLI</label>
          <el-tooltip placement="top" :effect="currentTheme !== 'light' ? 'light' : 'dark'" :open-delay="500">
            <div slot="content" v-html="$t('settings.installCLITips')"></div>
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-button
            class="settings-btn"
            type="primary"
            size="mini"
            icon="el-icon-download"
            :loading="installing"
            @click="handleInstallCLI"
          >
          </el-button>
        </el-col>
      </el-row>
      <el-divider></el-divider>
      <el-dialog
        width="50%"
        :title="$t('settings.downloadingCLI')"
        :close-on-click-modal="false"
        :visible.sync="progressVisible"
        :show-close="false"
        append-to-body
      >
        <el-progress :percentage="progressValue" color="#34c388"></el-progress>
      </el-dialog>
    </div>

    <div class="settings-advanced">
      <div class="settings-title">{{ $t('settings.advanced') }}</div>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between">
        <el-col :span="20">
          <label>{{ $t('log.logLevel') }}</label>
          <el-tooltip placement="top" :effect="currentTheme !== 'light' ? 'light' : 'dark'" :open-delay="500">
            <div slot="content" v-html="$t('log.logLevelDesc')"></div>
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-select class="settings-options" :value="logLevel" size="mini" @change="handleLevelChange">
            <el-option label="DEBUG" value="debug"></el-option>
            <el-option label="INFO" value="info"></el-option>
            <el-option label="WARN" value="warn"></el-option>
            <el-option label="ERROR" value="error"></el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.dataRecovery') }}</label>
        </el-col>
        <el-col :span="4">
          <el-button class="settings-btn" type="primary" size="mini" icon="el-icon-upload2" @click="handleImportData">
          </el-button>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.dataBackup') }}</label>
        </el-col>
        <el-col :span="4">
          <el-button class="settings-btn" type="primary" size="mini" icon="el-icon-printer" @click="handleExportData">
          </el-button>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.historyCleanup') }}</label>
        </el-col>
        <el-col :span="4">
          <el-button
            class="settings-btn"
            type="danger"
            size="mini"
            icon="el-icon-delete"
            @click="handleCleanupHistoryData"
          >
          </el-button>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.ignoreQoS0Message') }}</label>
          <el-tooltip
            placement="top"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('settings.ignoreQoS0MessageDesc')"
          >
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="ignoreQoS0Message"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleIgnoreQoS0MessageSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <ImportData :visible.sync="showImportData" />
      <ExportData :visible.sync="showExportData" />
      <ClearUpHistoryData :visible.sync="showHistoryData" />
    </div>

    <div class="settings-copilot">
      <div class="settings-title">MQTTX Copilot</div>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.enableCopilot') }}</label>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="enableCopilot"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleEnableCopilotSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="18">
          <label>API Host</label>
        </el-col>
        <el-col :span="6">
          <el-autocomplete
            size="mini"
            type="text"
            clearable
            v-model.trim="aiConfig.openAIAPIHost"
            :fetch-suggestions="queryAIAPIHost"
            :disabled="!enableCopilot"
            placeholder="https://api.openai.com/v1"
            @select="handleAIConfigHostSelected"
            @change="handleAIConfigChanged('host')"
          ></el-autocomplete>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="18">
          <label>API Key</label>
        </el-col>
        <el-col :span="6">
          <el-input
            size="mini"
            v-model.trim="aiConfig.openAIAPIKey"
            placeholder="sk-*******"
            type="password"
            clearable
            :disabled="!enableCopilot"
            @clear="handleAIConfigChanged('apiKey')"
            @blur="handleAIConfigChanged('apiKey')"
          ></el-input>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="18">
          <label>{{ $t('settings.model') }}</label>
        </el-col>
        <el-col :span="6" v-click-outside="handleClickPresetOutside">
          <transition name="el-zoom-in-bottom">
            <el-cascader-panel
              v-if="showAIModelsSelect"
              class="ai-models-select"
              :options="AImodelsOptions"
              :props="{ emitPath: false, label: 'value' }"
              :value="aiConfig.model"
              @change="handleAIConfigModelSelected"
            ></el-cascader-panel>
          </transition>
          <el-input
            size="mini"
            v-model.trim="aiConfig.model"
            placeholder="gpt-4o"
            type="text"
            clearable
            :disabled="!enableCopilot"
            @clear="handleAIConfigChanged('model')"
            @blur="handleAIConfigChanged('model')"
            @focus="showAIModelsSelect = true"
            @input="showAIModelsSelect = false"
          ></el-input>
        </el-col>
      </el-row>
      <el-divider></el-divider>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { ipcRenderer, remote } from 'electron'
import ImportData from '@/components/ImportData.vue'
import ExportData from '@/components/ExportData.vue'
import ClearUpHistoryData from '@/components/ClearUpHistoryData.vue'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY } from '@/utils/idGenerator'
import ClickOutside from 'vue-click-outside'
import _ from 'lodash'
import { AImodelsOptions, AIAPIHostOptions } from '@/utils/copilot'

@Component({
  components: { ImportData, ExportData, ClearUpHistoryData },
  directives: {
    ClickOutside,
  },
})
export default class Settings extends Vue {
  @Action('TOGGLE_THEME') private actionTheme!: (payload: { currentTheme: string }) => void
  @Action('TOGGLE_LANG') private actionLang!: (payload: { currentLang: string }) => void
  @Action('TOGGLE_AUTO_CHECK') private actionAutoCheck!: (payload: { autoCheck: boolean }) => void
  @Action('TOGGLE_AUTO_RESUB') private actionAutoResub!: (payload: { autoResub: boolean }) => void
  @Action('TOGGLE_SYNC_OS_THEME') private actionSyncOsTheme!: (payload: { syncOsTheme: boolean }) => void
  @Action('SET_MAX_RECONNECT_TIMES') private actionMaxReconnectTimes!: (payload: { maxReconnectTimes: number }) => void
  @Action('TOGGLE_MULTI_TOPICS') private actionToggleMultiTopics!: (payload: { multiTopics: boolean }) => void
  @Action('TOGGLE_JSON_HIGHLIGHT') private actionToggleJsonHighlight!: (payload: { jsonHighlight: boolean }) => void
  @Action('TOGGLE_ENABLE_COPILOT') private actionToggleEnableCopilot!: (payload: { enableCopilot: boolean }) => void
  @Action('SET_OPEN_AI_HOST') private actionSetOpenAIAPIHost!: (payload: { openAIAPIHost: string }) => void
  @Action('SET_OPEN_AI_API_KEY') private actionSetOpenAIAPIKey!: (payload: { openAIAPIKey: string }) => void
  @Action('SET_MODEL') private actionSetModel!: (payload: { model: App['model'] }) => void
  @Action('SET_LOG_LEVEL') private actionSetLogLevel!: (payload: { logLevel: LogLevel }) => void
  @Action('TOGGLE_IGNORE_QOS0_MESSAGE') private actionToggleIgnoreQoS0Message!: (payload: {
    ignoreQoS0Message: boolean
  }) => void

  @Getter('currentTheme') private currentTheme!: Theme
  @Getter('currentLang') private currentLang!: Language
  @Getter('autoCheck') private autoCheck!: boolean
  @Getter('autoResub') private autoResub!: boolean
  @Getter('syncOsTheme') private syncOsTheme!: boolean
  @Getter('maxReconnectTimes') private maxReconnectTimes!: number
  @Getter('multiTopics') private multiTopics!: boolean
  @Getter('jsonHighlight') private jsonHighlight!: boolean
  @Getter('enableCopilot') private enableCopilot!: boolean
  @Getter('openAIAPIHost') private openAIAPIHost!: string
  @Getter('openAIAPIKey') private openAIAPIKey!: string
  @Getter('model') private model!: App['model']
  @Getter('logLevel') private logLevel!: LogLevel
  @Getter('ignoreQoS0Message') private ignoreQoS0Message!: boolean

  private showAIModelsSelect = false

  private langOptions: Options[] = [
    { label: '简体中文', value: 'zh' },
    { label: 'English', value: 'en' },
    { label: '日本語', value: 'ja' },
    { label: 'Türkçe', value: 'tr' },
    { label: 'Magyar', value: 'hu' },
  ]
  private themeOptions: Options[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Night', value: 'night' },
  ]
  private AImodelsOptions = AImodelsOptions
  private AIAPIHostOptions = AIAPIHostOptions
  private showImportData = false
  private showExportData = false
  private showHistoryData = false

  private aiConfig: {
    model: App['model']
    openAIAPIKey: string
    openAIAPIHost: string
  } = {
    model: 'gpt-3.5-turbo',
    openAIAPIKey: '',
    openAIAPIHost: 'https://api.openai.com/v1',
  }

  private handleSelectChange(type: 'lang' | 'theme', value: string | number | boolean): void {
    if (type === 'theme') {
      this.actionTheme({ currentTheme: value as string })
    } else if (type === 'lang') {
      this.actionLang({ currentLang: value as string })
    }
    ipcRenderer.send('setting', type, value)
  }

  private handleAutoCheckSwitchChange(value: boolean) {
    this.actionAutoCheck({ autoCheck: value })
  }

  private handleAutoResubSwitchChange(value: boolean) {
    this.actionAutoResub({ autoResub: value })
  }

  private handleSyncOsThemeSwitchChange(value: boolean) {
    if (value) {
      const theme = remote.nativeTheme.shouldUseDarkColors ? 'night' : 'light'
      this.handleSelectChange('theme', theme)
    }
    this.actionSyncOsTheme({ syncOsTheme: value })
  }

  private handleMultiTopicsSwitchChange(value: boolean) {
    this.actionToggleMultiTopics({ multiTopics: value })
  }

  private handleInputChanged(value: number) {
    this.actionMaxReconnectTimes({ maxReconnectTimes: value })
  }

  private handleJsonHighlightSwitchChange(value: boolean) {
    this.actionToggleJsonHighlight({ jsonHighlight: value })
  }

  private handleImportData() {
    this.showImportData = true
  }

  private handleExportData() {
    this.showExportData = true
  }

  private handleCleanupHistoryData() {
    this.showHistoryData = true
  }

  private handleEnableCopilotSwitchChange(value: boolean) {
    this.actionToggleEnableCopilot({ enableCopilot: value })
  }

  private handleAIConfigChanged(action: 'apiKey' | 'model' | 'host') {
    switch (action) {
      case 'apiKey':
        const encryptedKey =
          this.aiConfig.openAIAPIKey.trim() !== ''
            ? CryptoJS.AES.encrypt(this.aiConfig.openAIAPIKey.trim(), ENCRYPT_KEY).toString()
            : ''
        this.actionSetOpenAIAPIKey({ openAIAPIKey: encryptedKey })
        break
      case 'model':
        this.actionSetModel({ model: this.aiConfig.model || 'gpt-4o' })
        break
      case 'host':
        this.actionSetOpenAIAPIHost({ openAIAPIHost: this.aiConfig.openAIAPIHost || 'https://api.openai.com/v1' })
        break
    }
  }

  private handleAIConfigModelSelected(value: App['model']) {
    this.aiConfig.model = value
    this.actionSetModel({ model: value })
    this.showAIModelsSelect = false
  }

  private handleAIConfigHostSelected({ value }: { value: string }) {
    this.aiConfig.openAIAPIHost = value
    this.actionSetOpenAIAPIHost({ openAIAPIHost: value })
  }

  private getAIConfigs() {
    this.aiConfig.model = this.model
    this.aiConfig.openAIAPIKey = this.openAIAPIKey
    this.aiConfig.openAIAPIHost = this.openAIAPIHost
  }

  private handleLevelChange(val: LogLevel) {
    const logger = this.$logRegsity()
    logger.level = val
    this.actionSetLogLevel({
      logLevel: val,
    })
  }

  private handleClickPresetOutside() {
    this.showAIModelsSelect = false
  }

  private queryAIAPIHost(queryString: string, cb: (r: any[]) => {}) {
    cb(queryString ? this.AIAPIHostOptions.filter((item) => item.value.includes(queryString)) : this.AIAPIHostOptions)
  }

  private handleIgnoreQoS0MessageSwitchChange(value: boolean) {
    this.actionToggleIgnoreQoS0Message({ ignoreQoS0Message: value })
  }

  private created() {
    this.getAIConfigs()
  }

  private progressVisible = false
  private installing = false
  private progressValue = 0

  private handleInstallCLI() {
    const throttledUpdate = _.throttle((progress, showProgress) => {
      this.progressValue = parseFloat((progress * 100).toFixed(2))
      this.progressVisible = showProgress
    }, 200)
    this.installing = true
    ipcRenderer.send('installCLI')
    ipcRenderer.on('downloadCLI', (event, ...args) => {
      const progress = args[0]
      const showProgress = args[1]
      throttledUpdate(progress, showProgress)
    })
    ipcRenderer.on('installedCLI', () => {
      this.installing = false
    })
  }

  private unbindIpcEvents(): void {
    ipcRenderer.removeAllListeners('downloadCLI')
    ipcRenderer.removeAllListeners('installedCLI')
  }

  private destroyed(): void {
    this.unbindIpcEvents()
  }
}
</script>

<style lang="scss" scope>
@import '@/assets/scss/variable.scss';

.settings-view {
  position: relative;
  padding: 0 16px;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;

  .settings-general {
    margin-top: 30px;
  }

  [class$='general'],
  [class$='appearance'],
  [class$='advanced'],
  [class$='copilot'] {
    margin-bottom: 56px;
  }

  .el-divider--horizontal {
    margin: 15px 0;
  }

  .settings-title {
    color: var(--color-text-light);
    margin-bottom: -5px;
  }

  .settings-item {
    label {
      color: var(--color-text-title);
    }
  }

  .el-col-4,
  .el-col-6 {
    text-align: right;
  }

  .settings-options {
    .el-input__inner {
      border: none;
      background: transparent;
      font-size: $font-size--body;
      color: var(--color-text-default);
    }

    &.el-select {
      width: 108px;
    }

    &.el-select .el-input .el-select__caret {
      color: var(--color-text-default);
    }
  }

  .el-input-number__increase,
  .el-input-number__decrease {
    background: transparent;
  }
  .el-input-number__decrease {
    border-right: 1px solid var(--color-border-default);
  }
  .el-input-number__increase {
    border-left: 1px solid var(--color-border-default);
  }
  .el-input-number--mini .el-input__inner {
    text-align: center;
  }

  i {
    font-size: 16px;
  }
  .settings-btn {
    width: 90px;
  }
  .icon-oper {
    position: relative;
    top: 1px;
    left: 5px;
    color: var(--color-text-default);
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
    .el-cascader-menu,
    i {
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
