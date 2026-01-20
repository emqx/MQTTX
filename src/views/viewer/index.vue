<template>
  <div class="viewer-view rightbar">
    <div class="titlebar flex items-center">
      <h1>{{ $t('viewer.viewer') }}</h1>
      <el-tag class="ml-2" size="mini" type="info">Beta</el-tag>
    </div>
    <div class="viewer-view-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('viewer.topicsTree')" name="TopicTree"></el-tab-pane>
        <el-tab-pane :label="$t('viewer.dashboard')" name="Dashboard"></el-tab-pane>
        <el-tab-pane :label="$t('viewer.trafficMonitor')" name="TrafficMonitor"></el-tab-pane>
        <el-tab-pane :label="$t('viewer.payloadInspector')" name="PayloadInspector"></el-tab-pane>
      </el-tabs>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'

enum ViewerTab {
  TopicTree = 'TopicTree',
  TrafficMonitor = 'TrafficMonitor',
  PayloadInspector = 'PayloadInspector',
}

@Component
export default class Viewer extends Vue {
  private activeTab = ViewerTab.TopicTree

  @Watch('$route.name', { deep: true })
  private setDefaultTab() {
    this.activeTab = this.$route.name as ViewerTab
  }

  created() {
    this.setDefaultTab()
  }

  private handleTabClick(tab: { name: ViewerTab }) {
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
