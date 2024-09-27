<template>
  <div class="viewer-view rightbar">
    <div class="titlebar">
      <h1>{{ $t('viewer.viewer') }}</h1>
    </div>
    <div class="viewer-view-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('viewer.topicsTree')" name="TopicTree"></el-tab-pane>
      </el-tabs>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Viewer extends Vue {
  private activeTab = 'TopicTree'

  private setDefaultTab() {
    this.activeTab = this.$route.name as string
  }

  created() {
    this.setDefaultTab()
  }

  private handleTabClick(tab: { name: string }) {
    this.$router.push({ name: tab.name })
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.viewer-view {
  position: relative;
  padding: 0 16px;
}
</style>
