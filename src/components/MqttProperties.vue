<template>
  <div class="mqtt-properties">
    <template v-for="field in propertyFields">
      <p
        v-if="properties[field.key]"
        :key="field.key"
        :class="['properties', direction, { 'user-properties': field.key === 'userProperties' }]"
      >
        <template v-if="field.key === 'userProperties'">
          <KeyValueEditor
            class="msg-item-props"
            :title="$t('connections.userProperties')"
            :disabled="true"
            :value="properties.userProperties"
          />
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
import KeyValueEditor from './KeyValueEditor.vue'

interface PropertyField {
  key: keyof PushPropertiesModel
}

@Component({
  components: {
    KeyValueEditor,
  },
})
export default class MqttProperties extends Vue {
  @Prop({ required: true }) public properties!: PushPropertiesModel
  @Prop({ default: '' }) public direction!: string
  @Prop({ default: true }) public showColon!: boolean

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

<style lang="scss" scoped></style>
