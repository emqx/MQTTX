<template>
  <div v-if="responseInformation" class="response-information">
    <el-popover
      v-model="visible"
      popper-class="response-information-popover"
      placement="bottom-start"
      trigger="click"
      :disabled="!truncated"
    >
      <pre class="response-information-value" @keydown.esc.stop="dismissDetails">{{ responseInformation }}</pre>
      <button
        slot="reference"
        ref="reference"
        type="button"
        class="response-information-reference"
        :disabled="!truncated"
        aria-label="Response Information"
        :aria-expanded="visible ? 'true' : 'false'"
        @keydown.esc.stop="dismissDetails"
      >
        <span class="response-information-label">Response Info</span>
        <span ref="preview" class="response-information-preview">{{ responseInformation }}</span>
      </button>
    </el-popover>
    <button
      type="button"
      class="copy-response-information"
      :aria-label="$t('common.copyTarget', { target: 'Response Information' })"
      v-clipboard:copy="responseInformation"
      v-clipboard:success="handleCopySuccess"
    >
      <i class="iconfont icon-copy"></i>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { MqttClient } from 'mqtt'

@Component
export default class ResponseInformation extends Vue {
  @Prop({ required: true }) public client!: Pick<MqttClient, 'connected' | 'responseInformation'>
  @Prop({ required: true }) public mqttVersion!: string

  private visible = false
  private truncated = false
  private previewObserver?: ResizeObserver

  mounted(): void {
    this.observePreview()
  }

  beforeDestroy(): void {
    this.previewObserver?.disconnect()
  }

  get responseInformation(): string {
    if (!this.client.connected || this.mqttVersion !== '5.0') return ''
    return this.client.responseInformation || ''
  }

  @Watch('client')
  @Watch('responseInformation')
  private closeDetails(): void {
    this.visible = false
    this.$nextTick(this.observePreview)
  }

  private observePreview(): void {
    this.previewObserver?.disconnect()
    const preview = this.$refs.preview as HTMLElement | undefined
    if (!preview) {
      this.truncated = false
      return
    }
    const update = () => {
      this.truncated = preview.scrollWidth > preview.clientWidth
      if (!this.truncated) this.visible = false
    }
    update()
    this.previewObserver = new window.ResizeObserver(update)
    this.previewObserver.observe(preview)
  }

  private dismissDetails(): void {
    this.visible = false
    const reference = this.$refs.reference as HTMLButtonElement
    reference.focus()
  }

  private handleCopySuccess(): void {
    this.$message.success(this.$tc('common.copyTargetSuccess', 1, { target: 'Response Information' }))
  }
}
</script>

<style lang="scss">
.response-information {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 124px;
  max-width: 280px;
  margin-left: 12px;
  -webkit-app-region: no-drag;

  > span {
    min-width: 0;
    flex: 1;
  }

  .response-information-reference,
  .copy-response-information {
    border: 0;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;

    &:focus-visible {
      outline: 1px solid var(--color-main-green);
      outline-offset: 2px;
    }
  }

  .response-information-reference {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
    padding: 4px;
    font: inherit;
    font-weight: 400;
    line-height: 18px;
    text-align: left;

    &:disabled {
      cursor: default;
    }

    &:enabled:hover .response-information-preview,
    &[aria-expanded='true'] .response-information-preview {
      background: color-mix(in srgb, var(--color-text-title) 14%, transparent);
    }
  }

  .response-information-label {
    flex-shrink: 0;
    color: color-mix(in srgb, var(--color-text-title) 65%, var(--color-bg-normal));
    font-size: 12px;
    white-space: nowrap;
  }

  .response-information-preview {
    min-width: 0;
    max-width: 150px;
    padding: 2px 6px;
    overflow: hidden;
    border-radius: 6px;
    background: color-mix(in srgb, var(--color-text-title) 10%, transparent);
    color: var(--color-text-title);
    font: 400 12px/16px ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .copy-response-information {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--color-text-light);

    i {
      font-size: 14px;
    }

    &:hover {
      background: color-mix(in srgb, var(--color-main-green) 9%, transparent);
      color: var(--color-main-green);
    }
  }
}

.el-popover.response-information-popover {
  width: max-content;
  min-width: 0;
  max-width: min(360px, calc(100vw - 32px));
  padding: 12px 14px;
  border-radius: 6px;
  box-shadow: 0 6px 20px var(--color-shadow-card);

  .response-information-value {
    max-height: 240px;
    margin: 0;
    overflow: auto;
    color: var(--color-text-title);
    font: 400 12px/1.6 ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    user-select: text;
  }
}
</style>
