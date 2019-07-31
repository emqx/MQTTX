<template>
  <div class="broker-topbar right-topbar">
    <div class="broker-info topbar">
      <div class="broker-head">
        <h2>Broker Name</h2>
      </div>
      <div class="broker-tail">
        <el-dropdown trigger="click">
          <a href="javascript:;">
            <i class="el-icon-more"></i>
          </a>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>
              <i class="iconfont icon-client"></i>oper
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class BrokerTopbar extends Vue {}
</script>


<style lang="scss" scope>
.broker-topbar {
  .broker-info {
    padding: 0 16px;
  }
}
</style>
