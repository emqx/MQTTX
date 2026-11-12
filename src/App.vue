<template>
  <div class="app">
    <RouterView />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
const Store = require('electron-store')

@Component
export default class App extends Vue {
  created() {
    this.$log.info('MQTTX Desktop App init')
    const settings = new Store()
    const adjusted = ['batchStorageMode', 'batchMaxItems', 'batchMaxBytes'].filter((key) => {
      const saved = settings.get(`settings.${key}`)
      return saved !== undefined && saved !== this.$store.getters[key]
    })
    if (adjusted.length) {
      this.$message.warning(
        this.$t('settings.batchSettingsNormalized', {
          settings: adjusted
            .map((key) => this.$t(`settings.${key}`))
            .join(this.$t('connections.batchSettingsSeparator') as string),
        }) as string,
      )
    }
  }
}
</script>

<style lang="scss">
@import './assets/font/iconfont.css';
@import './assets/scss/base.scss';
@import './assets/scss/theme/dark.scss';
@import './assets/scss/theme/light.scss';
@import './assets/scss/theme/night.scss';
</style>
