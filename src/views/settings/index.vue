<template>
  <div>
    <leftbar>
      <SettingsLeft/>
    </leftbar>

    <div class="settings-view right-content">
      <h1 class="titlebar">{{ $t('settings.settings') }}</h1>
      <div class="settings-general">
        <div class="settings-title">{{ $t('settings.general') }}</div>

        <el-divider></el-divider>

        <el-row class="settings-item" type="flex" justify="space-between">
          <el-col :span="20">
            <label>{{ $t('settings.language') }}</label>
          </el-col>
          <el-col :span="4">
            <el-select
              class="settings-options"
              v-model="currentLang"
              size="mini"
              @change="handleSelectChange('lang', $event)">
              <el-option
                v-for="(lang, index) in langOptions"
                :key="index"
                :label="lang.label"
                :value="lang.value">
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
              v-model="autoCheck"
              active-color="#13ce66"
              inactive-color="#A2A9B0"
              @change="handleSwitchChange">
            </el-switch>
          </el-col>
        </el-row>

        <el-divider></el-divider>
      </div>

      <div class="settings-appearance">
        <div class="settings-title">{{ $t('settings.appearance') }}</div>

        <el-divider></el-divider>
        
        <el-row class="settings-item" type="flex" justify="space-between">
          <el-col :span="20">
            <label>{{ $t('settings.theme') }}</label>
          </el-col>
          <el-col :span="4">
            <el-select
              class="settings-options"
              v-model="currentTheme"
              size="mini"
              @change="handleSelectChange('theme', $event)">
              <el-option
                v-for="(theme, index) in themeOptions"
                :key="index"
                :label="theme.label"
                :value="theme.value">
              </el-option>
            </el-select>
          </el-col>
        </el-row>

        <el-divider></el-divider>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { ipcRenderer } from 'electron'
import Leftbar from '@/components/Leftbar.vue'
import SettingsLeft from './SettingsLeft.vue'

@Component({
  components: {
    Leftbar,
    SettingsLeft,
  },
})
export default class Settings extends Vue {
  @Action('TOGGLE_THEME') private actionTheme: any
  @Action('TOGGLE_LANG') private actionLang: any
  @Action('TOGGLE_AUTO_CHECK') private actionAutoCheck: any
  @Getter('currentTheme') private getterTheme: any
  @Getter('currentLang') private getterLang: any
  @Getter('autoCheck') private getterAutoCheck: any

  private currentTheme: string = 'light'
  private currentLang: string = 'en'
  private autoCheck: boolean = false
  private langOptions: Options[] = [
    { label: '简体中文', value: 'zh' },
    { label: 'English', value: 'en' },
  ]
  private themeOptions: Options[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ]

  private handleSelectChange(type: string, value: string | number | boolean): void {
    if (type === 'theme') {
      this.actionTheme({ currentTheme: value })
    } else if (type === 'lang') {
      this.actionLang({ currentLang: value })
    }
    ipcRenderer.send('setting', type, value)
  }

  private handleSwitchChange(value: boolean): void {
    this.actionAutoCheck({ autoCheck: value })
  }

  private created(): void {
    this.autoCheck = this.getterAutoCheck
    this.currentTheme = this.getterTheme
    this.currentLang = this.getterLang
  }
}
</script>


<style lang="scss" scope>
@import '@/assets/scss/variable.scss';

.settings-view {
  padding: 0 16px;
  
  .titlebar {
    padding: 16px 0;
  }

  .settings-general {
    margin-top: 30px;
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

  .el-col-4 {
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
}
</style>
