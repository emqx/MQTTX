<template>
  <div class="mqtt-properties">
    <template v-for="field in propertyFields">
      <p
        v-if="properties[field.key]"
        :key="field.key"
        :class="['properties', direction, { 'user-properties': field.key === 'userProperties' }]"
      >
        <template v-if="field.key === 'userProperties'">
          <div class="properties-editor">
            <div class="properties-header">
              <span class="properties-title">{{ $t('connections.userProperties') }}</span>
            </div>
            <div v-for="(pair, index) in userProperties" :key="index" class="property-row">
              <div class="property-column input-prop">
                <span class="property-cell property-key" data-placeholder="Key">{{ pair.key }}</span>
              </div>
              <div class="property-column input-prop">
                <span class="property-cell property-value" data-placeholder="Value">{{ pair.value }}</span>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <span class="property-item">
            <span class="label"
              >{{ $t(`connections.${field.key}`) }}<span v-if="showColon" class="colon">: </span></span
            >
            <span class="value">{{ properties[field.key] }}</span>
          </span>
        </template>
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { userPropertiesToPairs } from '@/utils/mqtt5Properties'

interface PropertyField {
  key: keyof PushPropertiesModel
}

@Component
export default class MqttProperties extends Vue {
  @Prop({ required: true }) public properties!: PushPropertiesModel
  @Prop({ default: '' }) public direction!: string
  @Prop({ default: true }) public showColon!: boolean

  get userProperties(): { key: string; value: string }[] {
    return userPropertiesToPairs(this.properties.userProperties)
  }

  private propertyFields: PropertyField[] = [
    { key: 'subscriptionIdentifier' },
    { key: 'contentType' },
    { key: 'payloadFormatIndicator' },
    { key: 'topicAlias' },
    { key: 'responseTopic' },
    { key: 'correlationData' },
    { key: 'messageExpiryInterval' },
    { key: 'userProperties' },
  ]
}
</script>

<style lang="scss" scoped>
.mqtt-properties {
  .properties.left,
  .properties.right {
    margin-top: 12px;
    padding-top: 10px;
    &.user-properties {
      padding: 10px 0;
    }
  }
  .properties.left {
    color: var(--color-text-default);
    .property-cell {
      color: var(--color-text-left_info);
      border-color: var(--color-border-left_metainfo);
    }
  }
  .properties.right {
    color: var(--color-text-right_info);
    .property-cell {
      color: var(--color-text-active);
      border-color: var(--color-border-right_metainfo);
    }
  }
  .properties-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .properties-title {
    color: var(--color-text-title);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
  }
  .property-row {
    display: flex;
    align-items: center;
    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }
  .property-column {
    // Match the intrinsic width of KeyValueEditor's 20-column mini textarea.
    width: 176px;
    min-width: 0;
    flex: 1 1 auto;
    margin-right: 10px;
  }
  .property-cell {
    display: block;
    min-height: 28px;
    max-height: 64px;
    padding: 4px 15px;
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    background: var(--color-bg-msg-input);
    font-size: 12px;
    line-height: 18px;
    white-space: pre-wrap;
    word-break: break-all;
    overflow-wrap: break-word;
    overflow-y: auto;
    user-select: text;
    &:empty::before {
      content: attr(data-placeholder);
      color: var(--color-text-light);
    }
  }
  .user-properties.right .properties-title {
    color: var(--color-text-right_info);
  }
}
</style>
