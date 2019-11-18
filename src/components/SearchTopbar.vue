<template>
  <div class="search-topbar left-topbar topbar">
    <el-input 
      v-model="searchValue"
      size="small"
      clearable
      :placeholder="$t('connections.search')">
      <i v-if="!loading" slot="prefix" class="iconfont icon-search"></i>
      <i v-else slot="prefix" class="el-icon-loading"></i>
    </el-input>
    <a href="javascript:;" @click="newClick">
      <span class="iconfont icon-plus"></span>
    </a>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class SearchTopbar extends Vue {
  @Prop({ default: false }) private loading!: boolean

  private searchValue: string = ''

  @Watch('searchValue')
  private handleValueChange(val: string): void {
    if (val === '') {
      this.$emit('reload')
    } else {
      this.$emit('search', val)
    }
  }

  private newClick(): void {
    // New broker or connection
    this.$emit('showNewDialog')
  }
}
</script>


<style lang="scss">
.search-topbar {
  .el-input {
    width: 215px;
    .el-input__inner {
      background: var(--color-bg-input);
    }
    .icon-search, .el-icon-loading {
      margin-left: 3px;
      line-height: 32px;
      color: var(--color-text-tips);
    }
  }
  .icon-plus {
    font-size: 18px;
    color: var(--color-main-green);
  }
  a {
    cursor: pointer;
  }
}
</style>
