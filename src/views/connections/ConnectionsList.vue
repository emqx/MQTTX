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
          <div
            :class="['connection-status', {
              online: activeConnection[item.id] ? activeConnection[item.id].client.connected : false
            }]">
          </div>
          <div class="client-info">
            <el-tooltip
              :effect="theme !== 'light' ? 'dark' : 'light'"
              :disabled="`${item.name}@${item.host}:${item.port}`.length <= 30"
              :content="`${item.name}@${item.host}:${item.port}`"
              placement="top">
              <div class="client-name">
                {{ item.name }}@{{ item.host }}:{{item.port}}
              </div>
            </el-tooltip>
          </div>
          <div v-if="item.ssl" class="ssl-tag">
            <span>SSL</span>
          </div>
        </div>
        <div
          v-if="unreadMessageCount[item.id] > 0"
          class="new-msg-count">
          {{ unreadMessageCount[item.id] }}
        </div>
      </div>
    </template>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { ConnectionModel } from './types'
import { MqttClient } from 'mqtt'

@Component
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public data!: ConnectionModel[] | []
  @Prop({ required: true }) public connectionId!: string

  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: Client | undefined
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme

  private selectConnection(row: ConnectionModel) {
    this.unreadMessageIncrement({ id: row.id as string, unreadMessageCount: 0  })
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
    height: 64px;
    padding: 0 16px;
    cursor: pointer;
    position: relative;
    transition: background .3s ease;
    &.active {
      background-color: var(--color-bg-item);
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
        top: -36px;
        right: -1px;
        font-size: 12px;
        transform: rotate(45deg);
        color: #fff;
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
      background: var(--color-bg-item_status);
      vertical-align: top;
      margin-top: 10px;
      &.online {
        background: var(--color-main-green);
      }
    }
    &:hover {
      background: var(--color-bg-item);
    }
  }
}
</style>
