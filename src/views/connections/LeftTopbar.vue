<template>
  <div class="left-topbar">
    <el-input></el-input>
    <span class="iconfont icon-disconnect"></span>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LeftTopbar extends Vue {}
</script>


<style lang="scss">
.left-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  border-bottom: 1px solid var(--color-border-default);
  .el-input {
    margin-left: 16px;
    width: 208px;
    border-radius: 4px;
    input {
      background: var(--color-bg-primary);
      height: 32px;
      line-height: 32px;
    }
  }
  .iconfont {
    margin-right: 24px;
    font-size: 24px;
  }

}
</style>
