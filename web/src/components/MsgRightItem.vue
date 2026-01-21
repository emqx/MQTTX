<template>
  <div class="msg-right-item">
    <div class="right-payload payload" @contextmenu.prevent="customMenu($event)">
      <p class="right-info">
        <span class="topic">Topic: {{ topic }}</span>
        <span class="qos">QoS: {{ qos }}</span>
      </p>
      <div class="meta">
        <p v-if="properties.subscriptionIdentifier" class="properties right">
          <span>{{ $t('connections.subscriptionIdentifier') }}: {{ properties.subscriptionIdentifier }}</span>
        </p>
        <p v-if="properties.contentType" class="properties right">
          <span>{{ $t('connections.contentType') }}: {{ properties.contentType }}</span>
        </p>
        <p v-if="properties.topicAlias" class="properties right">
          <span>{{ $t('connections.topicAlias') }}: {{ properties.topicAlias }}</span>
        </p>
        <p v-if="properties.responseTopic" class="properties right">
          <span>{{ $t('connections.responseTopic') }}: {{ properties.responseTopic }}</span>
        </p>
        <p v-if="properties.correlationData" class="properties right">
          <span>{{ $t('connections.correlationData') }}: {{ properties.correlationData }}</span>
        </p>
        <p v-if="properties.userProperties" class="user-properties properties right">
          <KeyValueEditor
            class="msg-item-props"
            :title="$t('connections.userProperties')"
            :disabled="true"
            :value="properties.userProperties"
          />
        </p>
      </div>
      <pre>{{ payload }}</pre>
    </div>
    <p class="right-time time">{{ createAt }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import KeyValueEditor from './KeyValueEditor.vue'

@Component({
  components: {
    KeyValueEditor,
  },
})
export default class MsgrightItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public qos!: number
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public createAt!: string
  @Prop({ required: false, default: () => ({}) }) public properties!: PushPropertiesModel

  private customMenu(event: MouseEvent) {
    this.$emit('showmenu', this.payload, event)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.msg-right-item {
  text-align: right;
  @include msg-item;
  .right-payload {
    color: var(--color-text-active);
    background: var(--color-text-right_block);
    border-radius: 10px 0 10px 10px;
    text-align: left;
    box-shadow: 0 1px 3px var(--color-shadow-sendbtn);
  }
  .right-payload,
  .right-time {
    position: relative;
    left: 0px;
    animation: rightMsg 0.3s ease-in-out;
  }
}
</style>
