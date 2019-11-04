<template>
  <div class="connections-list">
    <div v-if="!data.length" class="no-data">{{ $t('common.noData') }}</div>
    <template v-else>
      <div
        v-for="item in data"
        :key="item.id"
        :class="['connection-item', { active: item.id === connectionId }]"
        @click="selectConnection(item)">
        <div class="item-left">
          <div :class="['connection-status', { online: item.client.connected }]"></div>
          <div class="client-info">
            <el-tooltip
              effect="light"
              :disabled="`${item.name}@${item.host}:${item.port}`.length < 25"
              :content="`${item.name}@${item.host}:${item.port}`"
              placement="top">
              <div class="client-name">
                {{ item.name  }}@{{ item.host }}:{{item.port}}
              </div>
            </el-tooltip>
          </div>
        </div>
        <div
          v-if="item.unreadMessageCount > 0"
          class="new-msg-count">
          {{ item.unreadMessageCount }}
        </div>
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
  @Prop({ required: true }) public connectionId!: string

  private selectConnection(row: ConnectionModel) {
    this.$router.push({ path: `/recent_connections/${row.id}` })
  }
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
        max-width: 200px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }
    .item-left {
      height: 28px;
      line-height: 28px;
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
      margin-top: 10px;
      &.online {
        background: var(--color-main-green);
      }
    }
  }
}
</style>
