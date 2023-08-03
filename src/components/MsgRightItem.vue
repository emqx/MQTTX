<template>
  <div class="msg-right-item">
    <div v-if="functionName || schemaName">
      <el-tag size="mini">
        <span>&nbsp;{{ $t('connections.usedScript') }}</span>
        <span v-if="functionName"
          >&nbsp;<b>{{ functionName }}</b
          >&nbsp;{{ $t('script.functionName') }}&nbsp;</span
        >
        <span v-if="functionName && schemaName">{{ $t('connections.usedScriptAnd') }}</span
        ><span v-if="schemaName"
          >&nbsp;<b>{{ schemaName }}</b
          >&nbsp;{{ $t('script.schemaName') }}&nbsp;</span
        ></el-tag
      >
    </div>
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
  @Prop({ required: false }) public meta?: string
  @Prop({ required: false, default: () => ({}) }) public properties!: PushPropertiesModel

  private customMenu(event: MouseEvent) {
    this.$emit('showmenu', this.payload, event)
  }

  get functionName() {
    return this.meta ? JSON.parse(this.meta).functionName : null
  }

  get schemaName() {
    return this.meta ? JSON.parse(this.meta).schemaName : null
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
  }
  .right-payload,
  .right-time {
    position: relative;
    left: 0px;
    animation: rightMsg 0.3s ease-in-out;
  }
  .input-prop {
    textarea {
      color: var(--color-text-active) !important;
      border: 1px solid var(--color-border-right_metainfo) !important;
    }
  }
}
</style>
