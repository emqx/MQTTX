<template>
  <div id="app">
    <NativeTitlebar v-if="OS === 'darwin'" />
    <RouterView/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NativeTitlebar from '@/components/NativeTitlebar.vue'

@Component({
  components: {
    NativeTitlebar,
  },
})
export default class App extends Vue {
  private OS = process.platform
}
</script>


<style lang="scss">
@import "./assets/font/iconfont.css";
@import "./assets/scss/base.scss";
@import "./assets/scss/theme/dark.scss";
@import "./assets/scss/theme/light.scss";
</style>
