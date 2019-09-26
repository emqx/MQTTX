<template>
  <div class="client-topbar right-topbar">
    <div class="client-info topbar">
      <div class="client-header">
        <a href="javascript:;" @click="$router.push({ path: '/brokers' })">
          <i class="el-icon-arrow-left"></i>{{ $t('common.back') }}
        </a>
      </div>
      <div class="client-body">
        <h2>{{ $t('brokers.newClient') }}</h2>
      </div>
      <div class="client-tail">
        <a href="javascript:;">
          {{ $t('common.save') }}
        </a>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ClientTopbar extends Vue {}
</script>


<style lang="scss" scope>
.client-topbar {
  .client-info {
    padding: 0 16px;
  }
}
</style>
