<template>
  <div class="connections-list">
    <div v-if="!data.length" class="no-data">{{ $t('common.noData') }}</div>
    <template v-else>
      <div class="connection-item">
        <div class="item-left">
          <div class="connection-status online"></div>
          <div class="client-info">
            <div class="client-name">Device 1</div>
            <div class="client-id">ClientID: 1111111111111</div>
          </div>
        </div>
        <div class="new-msg-count">12</div>
      </div>
      <div class="connection-item active">
        <div class="item-left">
          <div class="connection-status"></div>
          <div class="client-info">
            <div class="client-name">Device 2</div>
            <div class="client-id">ClientID: 2222222222222</div>
          </div>
        </div>
        <div class="new-msg-count">2</div>
      </div>
    </template>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { ConnectionModel } from './types'

@Component
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public data!: ConnectionModel[] | []
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";

.connections-list {
  .connection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 80px;
    padding: 0 16px;
    cursor: pointer;
    &.active {
      background-color: var(--color-bg-connection_item);
    }
    .client-info {
      display: inline-block;
      margin-left: 8px;
      .client-name {
        font-size: $font-size--body;
        font-weight: 500;
        color: var(--color-text-title);
      }
      .client-id {
        font-size: $font-size--tips;
        color: var(--color-text-default);
      }
    }
    .new-msg-count {
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      background: var(--color-main-green);
      border-radius: 9px;
      padding: 0 6px;
      color: #fff;
      font-size: $font-size--tips;
      text-align: center;
    }
    .connection-status {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: var(--color-bg-connection_status);
      vertical-align: top;
      margin-top: 7px;
      &.online {
        background: var(--color-main-green);
      }
    }
  }
}
</style>
