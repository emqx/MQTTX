<template>
  <div class="connections-content right-content">
    <div class="connections-footer">
      <el-button
        class="connect-btn"
        type="primary">
        {{ $t('connections.connectBroker') }}
      </el-button>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ConnectionsContent extends Vue {}
</script>


<style lang="scss">
@import "~@/assets/scss/variable.scss";

.connections-content {
  padding: 60px 0;
  .connections-footer {
    position: fixed;
    width: inherit;
    bottom: 0;
    left: 0;
    right: 0;
    margin-left: 300px;
    .connect-btn {
      width: 100%;
      height: 60px;
      border-radius: 0px;
      font-size: $font-size--title;
    }
  }
}
</style>
