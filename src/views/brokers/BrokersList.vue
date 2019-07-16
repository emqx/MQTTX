<template>
  <div class="brokers-list">
    <div class="broker-item">
      <div>
        <div class="broker-name">Broker 1</div>
        <div class="broker-url">127.0.0.1:1883</div>
      </div>
    </div>
    <div class="broker-item active">
      <div>
        <div class="broker-name">Broker 2</div>
        <div class="broker-url">127.0.0.1:8883</div>
      </div>
      <div class="ssl-tag">
        <span>SSL</span>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class BrokersList extends Vue {}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";

.brokers-list {
  .broker-item {
    display: flex;
    align-items: center;
    position: relative;
    height: 80px;
    padding: 0 32px;
    cursor: pointer;
    &.active {
      background-color: var(--color-bg-connection_item);
      border-left: 4px solid var(--color-main-green);
    }
    .broker-name {
      font-size: $font-size--body;
      font-weight: 500;
      color: var(--color-text-title);
    }
    .broker-url {
      font-size: $font-size--tips;
      color: var(--color-text-default);
    }
    .ssl-tag {
      position: absolute;
      right: 0;
      top: 0;
      width: 0;
      height: 0;
      border-top: 36px solid var(--color-main-green);
      border-left: 36px solid transparent;
      span {
        position: absolute;
        top: -32px;
        right: -2px;
        font-size: 12px;
        transform: rotate(45deg);
        color: #fff;
      }
    }
  }
}
</style>
