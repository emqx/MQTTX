<template>
  <div class="brokers-list">
    <div class="no-data" v-if="!data.length">{{ $t('common.noData') }}</div>
    <template v-else>
      <div
        v-for="broker in data"
        :key="broker.id"
        :class="['broker-item', { active: broker.id === brokerID }]"
        @click="selectBroker(broker)">
        <div>
          <div class="broker-name">{{ broker.brokerName }}</div>
          <div class="broker-url">{{ broker.brokerAddress }}:{{ broker.brokerPort }}</div>
        </div>
        <div v-if="broker.tls" class="ssl-tag">
          <span>SSL</span>
        </div>
        <a class="remove-icon" href="javascript:;" @click.stop="handleDelete(broker)">
          <i class="el-icon-close"></i>
        </a>
      </div>
    </template>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { deleteBroker } from '@/utils/api/broker'
import { BrokerModel } from './types'

@Component
export default class BrokersList extends Vue {
  @Prop({ required: true }) public data!: BrokerModel[] | []
  @Prop({ required: true }) public brokerID!: string

  private selectBroker(row: BrokerModel): void {
    this.$router.push({ path: `/brokers/${row.id}` })
  }

  private handleDelete(row: BrokerModel) {
    this.$emit('delete', row)
  }
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";

.brokers-list {
  .broker-item {
    display: flex;
    align-items: center;
    position: relative;
    height: 64px;
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
    .remove-icon {
      position: absolute;
      right: 19px;
      top: 22px;
      visibility: hidden;
      color: var(--color-second-red);
    }
    &:hover {
      .remove-icon {
        visibility: visible;
      }
    }
  }
}
</style>
