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
        <span class="topic">Topic: <span v-html="highlightedTopic"></span></span>
        <span class="qos">QoS: {{ qos }}</span>
        <el-tag v-if="batch" class="batch-tag" type="info" size="mini">Batch {{ batch.count }}</el-tag>
      </p>
      <MqttProperties class="meta" :properties="properties" direction="right" />
      <BatchItems
        v-if="batch"
        :items="batchItems"
        :count="batch.count"
        direction="right"
        @view-all="showFullMsg = true"
      />
      <pre v-else-if="!searchParams.payload">{{ highlightedPayload }}</pre>
      <pre v-else v-html="highlightedPayload"></pre>
      <p v-if="batch && !batch.payloadType" class="batch-notice">{{ $t('connections.batchLegacyPlaintext') }}</p>
    </div>
    <p class="right-time time">{{ createAt }}</p>
    <FullMsgDialog
      v-if="showFullMsg"
      :visible.sync="showFullMsg"
      :msgId="msgId"
      :msgType="batch.payloadType || 'Plaintext'"
      :batch-payload="payload"
      :batch-payload-type="batch.payloadType || 'Plaintext'"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import MqttProperties from './MqttProperties.vue'
import BatchItems from './BatchItems.vue'
import FullMsgDialog from './FullMsgDialog.vue'
import { getPublishedBatchItems, StoredBatchItem } from '@/utils/batchPayload'
import { highlightSearchTerm, escapeHtml } from '@/utils/highlightSearch'

@Component({
  components: {
    MqttProperties,
    BatchItems,
    FullMsgDialog,
  },
})
export default class MsgRightItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public qos!: number
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public createAt!: string
  @Prop({ required: true }) public msgId!: string
  @Prop({ required: false }) public meta?: string
  @Prop({ required: false, default: () => ({}) }) public properties!: PushPropertiesModel
  @Prop({ required: false, default: () => ({ topic: '', payload: '' }) }) public searchParams!: {
    topic: string
    payload: string
  }

  private showFullMsg = false

  get batchItems(): StoredBatchItem[] {
    return getPublishedBatchItems(this.payload, this.batch.payloadType || 'Plaintext')
  }

  get highlightedTopic(): string {
    if (this.searchParams.topic) {
      return highlightSearchTerm(this.topic, this.searchParams.topic, 'search-highlight')
    }
    return escapeHtml(this.topic)
  }

  get highlightedPayload(): string {
    if (this.searchParams.payload) {
      return highlightSearchTerm(this.payload, this.searchParams.payload, 'search-highlight')
    }
    return this.payload
  }

  public customMenu(event: MouseEvent) {
    this.$emit('showmenu', this.payload, event)
  }

  get batch() {
    return this.meta ? JSON.parse(this.meta).batch : undefined
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
    box-shadow: 0 1px 3px var(--color-shadow-sendbtn);
  }
  .right-payload,
  .right-time {
    position: relative;
    left: 0px;
    animation: rightMsg 0.3s ease-in-out;
  }
  .input-prop {
    textarea,
    .property-cell {
      color: var(--color-text-active) !important;
      border: 1px solid var(--color-border-right_metainfo) !important;
    }
  }
  .search-highlight {
    background-color: #ffeb3b !important;
    color: #000 !important;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: bold;
  }
}
</style>
