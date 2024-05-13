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
          <label>{{ $t('settings.autoScroll') }}</label>
          <el-tooltip
            placement="top"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('settings.autoScrollDesc')"
          >
            <a href="javascript:;" class="icon-oper">
              <i class="el-icon-warning-outline"></i>
            </a>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <el-switch
            :value="autoScroll"
            active-color="#13ce66"
            inactive-color="#A2A9B0"
            @change="handleAutoScrollSwitchChange"
          >
          </el-switch>
        </el-col>
      </el-row>

      <template v-if="autoScroll">
        <el-divider></el-divider>

        <el-row class="settings-item" type="flex" justify="space-between" align="middle">
          <el-col :span="18">
            <label>{{ $t('settings.autoScrollInterval') }}</label>
          </el-col>
          <el-col :span="4">
            <el-input-number size="mini" :value="autoScrollInterval" :min="0" @change="handleAutoScrollIntervalChange">
            </el-input-number>
          </el-col>
        </el-row>
      </template>

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
          <el-input-number size="mini" :value="maxReconnectTimes" :min="1" @change="handleInputChage">
          </el-input-number>
        </el-col>
      </el-row>

      <el-divider></el-divider>
    </div>

    <div class="settings-appearance">
      <div class="settings-title">{{ $t('settings.appearance') }}</div>

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
            @change="handleSelectChange('theme', $event)"
          >
            <el-option v-for="(theme, index) in themeOptions" :key="index" :label="theme.label" :value="theme.value">
            </el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-divider></el-divider>
    </div>

    <div class="settings-advanced">
      <div class="settings-title">{{ $t('settings.advanced') }}</div>
      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="20">
          <label>{{ $t('settings.historyCleanup') }}</label>
        </el-col>
        <el-col :span="4">
          <el-button
            class="data-manager-btn"
            type="danger"
            size="mini"
            icon="el-icon-delete"
            @click="handleCleanupHistoryData"
          >
          </el-button>
        </el-col>
      </el-row>
      <el-divider></el-divider>

      <ClearUpHistoryData :visible.sync="showHistoryData" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import ClearUpHistoryData from '@/components/ClearUpHistoryData.vue'

@Component({
  components: {
    ClearUpHistoryData,
  },
})
export default class Settings extends Vue {
  @Action('TOGGLE_THEME') private actionTheme!: (payload: { currentTheme: string }) => void
  @Action('TOGGLE_LANG') private actionLang!: (payload: { currentLang: string }) => void
  @Action('SET_MAX_RECONNECT_TIMES') private actionMaxReconnectTimes!: (payload: { maxReconnectTimes: number }) => void
  @Action('TOGGLE_AUTO_RESUB') private actionAutoResub!: (payload: { autoResub: boolean }) => void
  @Action('TOGGLE_AUTO_SCROLL') private actionAutoScroll!: (payload: { autoScroll: boolean }) => void
  @Action('SET_AUTO_SCROLL_INTERVAL') private actionAutoScrollInterval!: (payload: {
    autoScrollInterval: number
  }) => void
  @Action('TOGGLE_MULTI_TOPICS') private actionToggleMultiTopics!: (payload: { multiTopics: boolean }) => void
  @Getter('currentTheme') private currentTheme!: 'light' | 'dark' | 'night'
  @Getter('currentLang') private currentLang!: Language
  @Getter('maxReconnectTimes') private maxReconnectTimes!: number
  @Getter('autoResub') private autoResub!: boolean
  @Getter('autoScroll') private autoScroll!: boolean
  @Getter('autoScrollInterval') private autoScrollInterval!: number
  @Getter('multiTopics') private multiTopics!: boolean

  private langOptions: Options[] = [
    { label: '简体中文', value: 'zh' },
    { label: 'English', value: 'en' },
    { label: '日本語', value: 'ja' },
  ]
  private themeOptions: Options[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Night', value: 'night' },
  ]

  private showHistoryData = false

  private handleSelectChange(type: 'lang' | 'theme', value: string | number | boolean): void {
    if (type === 'theme') {
      this.actionTheme({ currentTheme: value as string })
      window.document.body.setAttribute('class', value as string)
    } else if (type === 'lang') {
      this.actionLang({ currentLang: value as string })
      document.documentElement.setAttribute('lang', value as string)
      this.$i18n.locale = value as string
    }
  }

  private handleAutoResubSwitchChange(value: boolean) {
    this.actionAutoResub({ autoResub: value })
  }

  private handleAutoScrollSwitchChange(value: boolean) {
    this.actionAutoScroll({ autoScroll: value })
  }

  private handleMultiTopicsSwitchChange(value: boolean) {
    this.actionToggleMultiTopics({ multiTopics: value })
  }

  private handleInputChage(value: number) {
    this.actionMaxReconnectTimes({ maxReconnectTimes: value })
  }

  private handleAutoScrollIntervalChange(value: number) {
    this.actionAutoScrollInterval({ autoScrollInterval: value })
  }

  private handleCleanupHistoryData() {
    this.showHistoryData = true
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

  .settings-general,
  .settings-appearance,
  .settings-advanced {
    max-width: 836px;
    margin: 0 auto;
  }

  .settings-general {
    margin-top: 30px;
  }

  [class$='general'],
  [class$='appearance'] {
    margin-bottom: 80px;
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
  .data-manager-btn {
    width: 90px;
  }
  .icon-oper {
    position: relative;
    top: 1px;
    left: 5px;
    color: var(--color-text-default);
  }
}
</style>
