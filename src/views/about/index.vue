<template>
  <div class="about-view rightbar">
    <h1 class="titlebar">{{ $t('about.about') }}</h1>
    <div class="about-content">
      <img class="logo" :src="logo" alt="mqttx">

      <p class="about-version">
        <span class="version">{{ $t('about.version') }} 1.2.0</span>
        <a class="update" href="javascript:;" @click="checkUpdate">{{ $t('about.update') }}</a>
      </p>

      <div class="about-website">
        <label><i class="iconfont icon-website"></i>{{ $t('about.web') }}: </label>
        <a
          class="web-link"
          href="https://emqx.io"
          target="_blank"
          rel="noopener noreferrer">
          emqx.io
        </a>
      </div>

      <div class="about-website">
        <label><i class="iconfont icon-github"></i>GitHub: </label>
        <a
          class="web-link"
          href="https://github.com/emqx/MQTTX"
          target="_blank"
          rel="noopener noreferrer">
          github.com/emqx/MQTTX
        </a>
      </div>
    </div>

    <p class="about-footer">
      <span class="copyright">Copyright &copy; 2019 EMQ X Team</span>
      <a
        class="web-link"
        href="https://github.com/emqx/MQTTX/issues"
        target="_blank"
        rel="noopener noreferrer">
        {{ $t('about.support') }}
      </a>
      <a
        class="web-link"
        href="https://github.com/emqx/MQTTX/releases"
        target="_blank"
        rel="noopener noreferrer"
        style="margin-right: 30px;">
        {{ $t('about.release') }}
      </a>
      <a
        class="web-link"
        href="https://github.com/emqx/emqx"
        target="_blank"
        rel="noopener noreferrer"
        style="margin-right: 30px;">
        EMQ X
      </a>
    </p>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { ipcRenderer } from 'electron'

@Component
export default class About extends Vue {
  @Getter('currentTheme') private getterTheme!: Theme

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
.about-view {
  position: relative;
  padding: 0 16px;

  & > .about-content {
    height: 80%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .logo {
    margin-bottom: 30px;
  }

  .about-version {
    margin-bottom: 35px;
    font-size: 1rem;
    .version {
      margin-right: 30px;
    }
    .update {
      font-size: 1rem;
    }
  }

  .about-website {
    margin-bottom: 10px;
    label {
      margin-right: 5px;
    }
    .iconfont {
      font-size: 1.25rem;
      position: relative;
      top: 2px;
      margin-right: 3px;
    }
    .web-link {
      color: var(--color-text-title);
    }
  }

  .about-footer {
    margin-top: 40px;
    position: absolute;
    bottom: 28px;
    left: 16px;
    right: 16px;
    .web-link {
      float: right;
      color: var(--color-text-default);
    }
  }
}
</style>
