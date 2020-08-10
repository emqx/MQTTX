<template>
  <div class="connections-list">
    <div v-if="!data.length" class="no-data">{{ $t('common.noData') }}</div>
    <template v-else>
      <div
        v-for="item in data"
        :key="item.id"
        :class="['connection-item', { active: item.id === connectionId }]"
        @click="handleSelectConnection(item)"
        @contextmenu="handleContextMenu(item, $event)"
      >
        <div class="item-left">
          <div
            :class="[
              'connection-status',
              {
                online: activeConnection[item.id] ? activeConnection[item.id].client.connected : false,
              },
            ]"
          ></div>
          <div class="client-info">
            <el-tooltip
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :disabled="`${item.name}@${item.host}:${item.port}`.length < 26"
              :content="`${item.name}@${item.host}:${item.port}`"
              :open-delay="500"
              placement="top"
            >
              <div class="client-name">{{ item.name }}@{{ item.host }}:{{ item.port }}</div>
            </el-tooltip>
          </div>
          <div v-if="item.ssl" class="ssl-tag">
            <span>SSL</span>
          </div>
        </div>
        <div v-if="unreadMessageCount[item.id] > 0" class="new-msg-count">
          {{ unreadMessageCount[item.id] }}
        </div>
      </div>
    </template>
    <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
      <a href="javascript:;" class="context-menu__item danger" @click="handleDelete">
        <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
      </a>
    </contextmenu>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { MqttClient } from 'mqtt'
import Contextmenu from '@/components/Contextmenu.vue'
import { ConnectionModel, ContextmenuModel } from './types'

@Component({
  components: {
    Contextmenu,
  },
})
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public data!: ConnectionModel[] | []
  @Prop({ required: true }) public connectionId!: string

  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: Client | undefined
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme

  private showContextmenu: boolean = false
  private selectedConnection: ConnectionModel | null = null
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }

  @Watch('showContextmenu')
  private handleShowContextmenuChange(val: boolean) {
    if (!val) {
      this.selectedConnection = null
    }
  }

  private handleSelectConnection(row: ConnectionModel) {
    this.unreadMessageIncrement({ id: row.id as string, unreadMessageCount: 0 })
    this.$router.push({ path: `/recent_connections/${row.id}` })
  }

  private handleContextMenu(row: ConnectionModel, event: MouseEvent) {
    if (!this.showContextmenu) {
      const { clientX, clientY } = event
      this.contextmenuConfig.top = clientY
      this.contextmenuConfig.left = clientX
      this.showContextmenu = true
      this.selectedConnection = row
    } else {
      this.showContextmenu = false
    }
  }

  private handleDelete() {
    this.$emit('delete', this.selectedConnection)
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/variable.scss';

.connections-list {
  .connection-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 16px;
    cursor: pointer;
    position: relative;
    transition: background 0.3s ease;
    user-select: none;
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
        max-width: 180px;
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
