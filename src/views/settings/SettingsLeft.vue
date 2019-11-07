<template>
  <div class="settings-left">
    <img class="logo" src="../../assets/images/mqttx.png" alt="mqttx">
    <p class="version">{{ $t('settings.version') }} 1.0.0</p>
    <a class="update" href="javascript:;">{{ $t('settings.update') }}</a>

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

@Component
export default class SettingsLeft extends Vue {}
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
