<template>
  <div class="right-topbar topbar">
    <div class="connection-haed">
      <h2>Device xxx</h2>
      <a href="javascript:;">6 subscriptions</a>
    </div>
    <div class="connection-tail">
      <a href="javascript:;">
        <i slot="prefix" class="iconfont icon-search"></i>
      </a>
      <a href="javascript:;">
        <i class="el-icon-more"></i>
      </a>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class RightTopbar extends Vue {}
</script>


<style lang="scss">
.right-topbar {
  background-color: var(--color-bg-normal);
  padding: 0 16px;
  .icon-search {
    margin-right: 10px;
  }
}
</style>
