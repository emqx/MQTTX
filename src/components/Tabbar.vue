<template>
  <div class="tabbar">
    <el-row>
      <el-col :span="8" :class="{ active: $route.path === '/recent_connections' }"
        @click.native="$router.push({ path: '/recent_connections' })">
        <span class="iconfont icon-connections"></span>
      </el-col>
      <el-col :span="8" :class="{ active: $route.path === '/brokers' }"
        @click.native="$router.push({ path: '/brokers' })">
        <span class="iconfont icon-brokers"></span>
      </el-col>
      <el-col :span="8" :class="{ active: $route.path === '/settings' }"
        @click.native="$router.push({ path: '/settings' })">
        <span class="iconfont icon-settings"></span>
      </el-col>
    </el-row>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Tabbar extends Vue {}
</script>


<style lang="scss">
@import "~@/assets/scss/variable.scss";

.tabbar {
  position: fixed;
  width: 300px;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1001;
  border-top: 2px solid var(--color-border-default);
  border-right: 2px solid var(--color-border-default);
  text-align: center;

  .el-col {
    height: 56px;
    line-height: 56px;
    cursor: pointer;
    &:hover, &.active {
      background-color: var(--color-bg-tabs_hover);
      .iconfont {
        color: var(--color-main-green);
      }
    }
    &.active {
      border-bottom: 4px solid var(--color-main-green);
    }
  }
  .iconfont {
    color: var(--color-text-light);
    font-size: $font-size--tabbar_title;
  }
}
</style>
