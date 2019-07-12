<template>
  <div class="connections-content right-content">
    <div class="connections-footer">
      <!-- <el-button
        class="connect-btn"
        type="primary">
        {{ $t('connections.connectBroker') }}
      </el-button> -->
      <div class="connect-message">
        <el-input placeholder="Write a message" @focus="canSend = true"></el-input>
        <a
          href="javascript:;"
          :class="['send-btn', canSend ? '' : 'disabled']"
          @click="sendMsg">
          <i class="iconfont icon-send"></i>
        </a>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ConnectionsContent extends Vue {
  private canSend: boolean = false

  private sendMsg(): void {
    if (!this.canSend) {
      return
    }
  }
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";
@import "~@/assets/scss/mixins.scss";

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
    .connect-message {
      @include flex-space-between;
      width: 100%;
      height: 60px;
      padding-right: 16px;
      background: var(--color-bg-normal);
      border-top: 2px solid var(--color-border-default);
      .el-input__inner {
        border: 0px;
        border-radius: 0px;
      }
      .send-btn {
        &.disabled {
          color: var(--color-text-tips);
          cursor: not-allowed;
        }
        .icon-send {
          font-size: $font-size--send;
        }
      }
    }
  }
}
</style>
