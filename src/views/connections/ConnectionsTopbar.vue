<template>
  <div class="connections-topbar right-topbar">
    <div class="connections-info topbar">
        <div class="connection-head">
        <h2>Device xxx</h2>
        <a v-if="isConnected" href="javascript:;" @click.stop="showSubs">6 {{ $t('connections.subscription') }}</a>
        <a v-else class="error" href="javascript:;">{{ $t('connections.disconnected') }}</a>
      </div>
      <div class="connection-tail">
        <a href="javascript:;" @click="searchVisible = !searchVisible">
          <i class="iconfont icon-search"></i>
        </a>
        <el-dropdown trigger="click">
          <a href="javascript:;">
            <i class="el-icon-more"></i>
          </a>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>
              <i class="iconfont icon-client"></i>{{ $t('connections.clientInfo') }}
            </el-dropdown-item>
            <el-dropdown-item>
              <i class="iconfont icon-clear"></i>{{ $t('connections.clearHistory') }}
            </el-dropdown-item>
            <el-dropdown-item>
              <i class="iconfont icon-disconnect"></i>{{ $t('connections.disconnect') }}
            </el-dropdown-item>
            <el-dropdown-item>
              <i class="iconfont icon-delete"></i>{{ $t('connections.deleteConnect') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <transition name="el-zoom-in-top">
      <div v-if="searchVisible" class="connections-search topbar">
        <el-input size="small" :placeholder="$t('connections.searchByTopic')">
          <i slot="suffix" class="iconfont icon-search"></i>
        </el-input>
        <a href="javascript:;" class="close-search" @click="searchVisible = false">
          <i class="el-icon-circle-close"></i>
        </a>
      </div>
    </transition>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ConnectionsTopbar extends Vue {
  private searchVisible: boolean = false
  private isConnected: boolean = true

  private showSubs(): void {
    this.$emit('click-subs')
  }
}
</script>


<style lang="scss" scope>
.connections-topbar {
  .connections-info {
    padding: 0 16px;
    background-color: var(--color-bg-normal);
  }
  .connections-search {
    padding: 0 16px;
    height: 64px;
    background-color: var(--color-bg-normal);
    .icon-search {
      line-height: 32px;
    }
    .el-input {
      .el-input__inner {
        background: var(--color-bg-primary);
      }
    }
    .close-search {
      font-size: 18px;
      color: var(--color-text-default);
      margin-left: 10px;
    }
  }
  .icon-search {
    margin-right: 10px;
  }
}
</style>
