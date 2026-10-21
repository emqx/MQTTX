<template>
  <div class="message-header-meta">
    <span class="header-time">{{ formatTime(message.createAt) }}</span>
    <div class="header-badges">
      <span class="badge">QoS {{ message.qos }}</span>
      <span class="badge retain" v-if="message.retain">{{ $t('connections.retained') }}</span>
      <span class="badge">{{ getPayloadSize(message.payload) }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { calculateTextSize } from '@/utils/data'

@Component
export default class MessageHeaderMeta extends Vue {
  @Prop({ type: Object, required: true }) private message!: MessageModel

  private formatTime(timeString: string): string {
    try {
      return new Date(timeString).toLocaleString()
    } catch {
      return timeString
    }
  }

  private getPayloadSize(payload: string): string {
    return calculateTextSize(payload)
  }
}
</script>

<style lang="scss" scoped>
.message-header-meta {
  display: flex;
  align-items: center;
  gap: 12px;

  .header-time {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-title);
    font-variant-numeric: tabular-nums;
  }

  .header-badges {
    display: flex;
    align-items: center;
    gap: 8px;

    .badge {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 4px;
      background: var(--color-bg-normal);
      color: var(--color-text-default);
      border: 1px solid var(--color-border-default);

      &.retain {
        background: var(--color-main-yellow);
        border-color: var(--color-main-yellow);
        color: #fff;
      }
    }
  }
}
</style>
