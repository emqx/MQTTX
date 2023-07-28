<template>
  <div class="msg-left-item">
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
    <span
      class="topic-color"
      :style="{
        background: color,
        height: functionName || schemaName ? 'calc(100% - 62px)' : 'calc(100% - 44px)',
        top: functionName || schemaName ? '32px' : '11px',
      }"
    ></span>
    <div ref="leftPayload" class="left-payload payload" @contextmenu.prevent="customMenu($event)">
      <p class="left-info">
        <span class="topic">Topic: {{ topic }}</span>
        <span class="qos">QoS: {{ qos }}</span>
        <span v-if="retain" class="retain">Retain</span>
      </p>
      <div class="meta">
        <p v-if="properties.subscriptionIdentifier" class="properties left">
          <span>{{ $t('connections.subscriptionIdentifier') }}: {{ properties.subscriptionIdentifier }}</span>
        </p>
        <p v-if="properties.contentType" class="properties left">
          <span>{{ $t('connections.contentType') }}: {{ properties.contentType }}</span>
        </p>
        <p v-if="properties.topicAlias" class="properties left">
          <span>{{ $t('connections.topicAlias') }}: {{ properties.topicAlias }}</span>
        </p>
        <p v-if="properties.responseTopic" class="properties left">
          <span>{{ $t('connections.responseTopic') }}: {{ properties.responseTopic }}</span>
        </p>
        <p v-if="properties.correlationData" class="properties left">
          <span>{{ $t('connections.correlationData') }}: {{ properties.correlationData }}</span>
        </p>
        <p v-if="properties.userProperties" class="user-properties properties left">
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
    <p class="left-time time">{{ createAt }}</p>
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
export default class MsgLeftItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public qos!: number
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public createAt!: string
  @Prop({ required: false }) public meta?: string
  @Prop({ required: false, default: false }) public retain!: boolean
  @Prop({ required: false, default: () => ({}) }) public properties!: PushPropertiesModel
  @Prop({ required: false, default: '' }) public color!: string

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

.msg-left-item {
  @include msg-item;
  text-align: left;
  position: relative;
  .el-tag {
    color: var(--color-text-tags);
    background: var(--color-bg-tags);
    border-color: var(--color-border-right_metainfo);
  }
  .topic-color {
    height: calc(100% - 62px);
    display: inline-block;
    width: 4px;
    position: absolute;
    top: 32px;
    border-radius: 8px;
    left: -4px;
  }
  .left-payload {
    background: var(--color-main-grey);
    border-radius: 0px 10px 10px 10px;
    position: relative;
  }
  .left-payload,
  .left-time {
    position: relative;
    right: 0px;
    animation: leftMsg 0.3s ease-in-out;
  }
  .input-prop {
    textarea {
      color: var(--color-text-left_info) !important;
      border: 1px solid var(--color-border-left_metainfo) !important;
    }
  }
}
</style>
