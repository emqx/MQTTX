<template>
  <div class="settings-left">
    <img class="logo" :src="logo" alt="mqttx">
    <p class="version">{{ $t('settings.version') }} 1.1.1</p>
    <a class="update" href="javascript:;" @click="checkUpdate">{{ $t('settings.update') }}</a>

    <a
      class="web-link"
      href="https://emqx.io"
      target="_blank"
      rel="noopener noreferrer">
      <i class="iconfont icon-website"></i>
      emqx.io
    </a>
    <a
      class="web-link"
      href="https://github.com/emqx/MQTTX"
      target="_blank"
      rel="noopener noreferrer">
      <i class="iconfont icon-github"></i>
      github.com/emqx/MQTTX
    </a>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'

@Component
export default class SettingsLeft extends Vue {
  @Getter('currentTheme') private getterTheme!: 'light' | 'dark' | 'purple'

  get logo(): string {
    if (this.getterTheme === 'light') {
      return require('../../assets/images/mqttx-light.png')
    }
    return require('../../assets/images/mqttx-dark.png')
  }

  private checkUpdate(): void {
    ipcRenderer.send('checkUpdate')
  }
}
</script>


<style lang="scss" scope>
.settings-left {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: wrap;
  flex-direction: column;
  height: 100%;
  position: relative;
  top: -10px;

  .logo {
    width: 159px;
    height: 54px;
  }

  .version {
    margin: 10px 0;
  }

  .update {
    margin-bottom: 40px;
  }

  .web-link {
    color: var(--color-text-default);
    margin: 5px 0;
  }

  .iconfont {
    font-size: 1.25rem;
    position: relative;
    top: 2px;
  }
}
</style>
