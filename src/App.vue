<template>
  <div class="app">
    <RouterView />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {
  created() {
    this.$log.info('MQTTX Desktop App init')
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
