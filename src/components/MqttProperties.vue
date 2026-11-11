<template>
  <div class="mqtt-properties">
    <template v-for="field in propertyFields">
      <p
        v-if="properties[field.key]"
        :key="field.key"
        :class="['properties', direction, { 'user-properties': field.key === 'userProperties' }]"
      >
        <template v-if="field.key === 'userProperties'">
          <span class="user-properties-title">{{ $t('connections.userProperties') }}</span>
          <span v-for="(pair, index) in userProperties" :key="index" class="user-property"
            >{{ pair.key }}: {{ pair.value }}</span
          >
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

interface PropertyField {
  key: keyof PushPropertiesModel
}

@Component
export default class MqttProperties extends Vue {
  @Prop({ required: true }) public properties!: PushPropertiesModel
  @Prop({ default: '' }) public direction!: string
  @Prop({ default: true }) public showColon!: boolean

  get userProperties(): { key: string; value: string }[] {
    return Object.entries(this.properties.userProperties || {}).flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value]).map((item) => ({ key, value: item })),
    )
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
  .user-properties-title {
    display: block;
    margin-bottom: 6px;
    color: var(--color-text-tips);
    font-size: 12px;
    font-weight: 500;
  }
  .user-property {
    display: inline-block;
    max-width: 100%;
    margin: 0 6px 6px 0;
    padding: 1px 8px;
    border: 1px solid var(--color-border-default);
    border-radius: 4px;
    background: transparent;
    font-size: 12px;
    line-height: 1.6;
    vertical-align: top;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    user-select: text;
  }
  .user-properties.right .user-properties-title {
    color: var(--color-text-right_info);
  }
  .user-properties.right .user-property {
    border-color: var(--color-border-right_metainfo);
  }
}
</style>
