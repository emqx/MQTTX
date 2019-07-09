<template>
  <div class="left-topbar topbar">
    <el-input size="small" :placeholder="$t('connections.search')">
      <i slot="prefix" class="iconfont icon-search"></i>
    </el-input>
    <a href="javascript:;" title="Add Connection">
      <span class="iconfont icon-plus"></span>
    </a>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LeftTopbar extends Vue {}
</script>


<style lang="scss">
.left-topbar {
  .el-input {
    margin-left: 16px;
    width: 232px;
    .el-input__inner {
      background: var(--color-bg-primary);
    }
    .icon-search {
      margin-left: 3px;
      line-height: 32px;
      color: var(--color-text-tips);
    }
  }
  .icon-plus {
    font-size: 18px;
    margin-right: 16px;
    color: var(--color-main-green);
  }
}
</style>
