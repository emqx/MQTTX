<template>
  <div class="viewer-view rightbar">
    <div class="titlebar">
      <h1>{{ $t('viewer.viewer') }}</h1>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Viewer extends Vue {}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.viewer-view {
  position: relative;
  padding: 0 16px;
}
</style>
