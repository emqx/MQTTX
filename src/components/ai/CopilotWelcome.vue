<template>
  <div v-if="show" class="welcome-message">
    <div class="welcome-content">
      <h1>MQTTX <span class="subtitle">Copilot</span></h1>
      <p class="description">{{ $t('copilot.welcomeToCopilot') }}</p>

      <div class="tip-box">
        <div class="tip-header">
          <i class="el-icon-info"></i>
          <span>{{ $t('copilot.didYouKnow') }}</span>
        </div>
        <p>{{ randomTip }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class CopilotWelcome extends Vue {
  @Prop({ default: true }) readonly show!: boolean

  private tipIndex = Math.floor(Math.random() * 7) + 1

  get randomTip(): string {
    return this.$t(`copilot.tipContent${this.tipIndex}`) as string
  }

  @Watch('show')
  onShowChange(newVal: boolean) {
    if (newVal) {
      this.tipIndex = Math.floor(Math.random() * 6) + 1
    }
  }
}
</script>

<style lang="scss" scoped>
.welcome-message {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  padding-top: 40px;

  .welcome-content {
    width: 90%;
    max-width: 700px;
    text-align: left;
    color: var(--color-text-default);
    line-height: 1.6;

    h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;

      .subtitle {
        color: var(--color-text-light);
        font-weight: normal;
      }
    }

    .description {
      font-size: 15px;
      margin-bottom: 30px;
      color: var(--color-text-light);
    }

    .tip-box {
      background-color: var(--color-bg-primary);
      border-radius: 8px;
      padding: 16px;
      margin-top: 30px;
      border: 1px solid var(--color-border-default);

      .tip-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        i {
          margin-right: 8px;
          color: var(--color-text-light);
          font-size: 16px;
        }

        span {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-light);
        }
      }

      p {
        font-size: 14px;
        margin: 0;
        color: var(--color-text-default);
      }
    }
  }
}
</style>
