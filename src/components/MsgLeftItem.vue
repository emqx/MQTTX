<template>
  <div ref="msgLeftItem" class="msg-left-item">
    <div v-if="functionName || schemaName" class="msg-tag">
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
    <div v-if="msgError" class="msg-tag">
      <el-tag type="danger" size="mini">
        <span>{{ msgError }}</span>
      </el-tag>
    </div>
    <span
      class="topic-color"
      :style="{
        background: color,
        height: topicColorStyle.height,
        top: topicColorStyle.top,
      }"
    >
    </span>
    <div ref="leftPayload" class="left-payload payload" @contextmenu.prevent="customMenu($event)">
      <p class="left-info">
        <span class="topic">Topic: {{ topic }}</span>
        <span class="qos">QoS: {{ qos }}</span>
        <span v-if="retain" class="retain">Retained</span>
      </p>
      <div class="meta">
        <p v-if="properties.subscriptionIdentifier" class="properties left">
          <span>{{ $t('connections.subscriptionIdentifier') }}: {{ properties.subscriptionIdentifier }}</span>
        </p>
        <p v-if="properties.contentType" class="properties left">
          <span>{{ $t('connections.contentType') }}: {{ properties.contentType }}</span>
        </p>
        <p v-if="properties.payloadFormatIndicator" class="properties left">
          <span>{{ $t('connections.payloadFormatIndicator') }}: {{ properties.payloadFormatIndicator }}</span>
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
        <p v-if="properties.messageExpiryInterval" class="properties left">
          <span>{{ $t('connections.messageExpiryInterval') }}: {{ properties.messageExpiryInterval }}</span>
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
      <template v-if="isLargeMsg">
        <div class="large-message { .el-button { margin-top: 12px;}}">
          <pre>{{ payload.substr(0, showMaxLen) }}<span><i class="iconfont icon-more"></i></span></pre>
          <el-tooltip
            placement="bottom"
            :effect="theme !== 'light' ? 'light' : 'dark'"
            :open-delay="500"
            :content="$t('connections.messageTooLargeToHide')"
          >
            <el-button type="info" plain size="mini" class="see-more-btn" @click="handleShowFullMsg()">{{
              $t('common.seeMore')
            }}</el-button>
          </el-tooltip>
        </div>
      </template>
      <template v-else>
        <pre v-if="!hightlight">{{ payload }}</pre>
        <pre v-else><code class="language-js" >{{ payload }}</code></pre>
      </template>
    </div>
    <p class="left-time time">{{ createAt }}</p>
    <FullMsgDialog v-if="showFullMsg" :visible.sync="showFullMsg" :msgId="msgId" :msgType="msgType" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import KeyValueEditor from './KeyValueEditor.vue'
import FullMsgDialog from './FullMsgDialog.vue'
import Prism from 'prismjs'
import { Getter } from 'vuex-class'
import { SHOW_MAX_LENGTH } from '@/utils/data'

@Component({
  components: {
    KeyValueEditor,
    FullMsgDialog,
  },
})
export default class MsgLeftItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public qos!: number
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public createAt!: string
  @Prop({ required: true }) public msgId!: string
  @Prop({ required: false }) public meta?: string
  @Prop({ required: false, default: false }) public retain!: boolean
  @Prop({ required: false, default: () => ({}) }) public properties!: PushPropertiesModel
  @Prop({ required: false, default: '' }) public color!: string

  @Getter('jsonHighlight') private jsonHighlight!: boolean
  @Getter('currentTheme') private theme!: Theme

  public hightlight: boolean = false

  private showFullMsg: boolean = false

  public customMenu(event: MouseEvent) {
    this.$emit('showmenu', this.payload, event)
  }

  get topicColorStyle() {
    const hasFunctionOrSchema = this.functionName || this.schemaName
    if (!hasFunctionOrSchema && !this.msgError) {
      return { height: 'calc(100% - 44px)', top: '11px' }
    } else if (hasFunctionOrSchema && this.msgError) {
      return { height: 'calc(100% - 84px)', top: '55px' }
    } else {
      return { height: 'calc(100% - 62px)', top: '32px' }
    }
  }

  get functionName() {
    return this.meta ? JSON.parse(this.meta).functionName : null
  }

  get schemaName() {
    return this.meta ? JSON.parse(this.meta).schemaName : null
  }

  get msgType() {
    return this.meta ? JSON.parse(this.meta).msgType : null
  }

  get msgError() {
    return this.meta ? JSON.parse(this.meta).msgError : null
  }

  get isLargeMsg() {
    return this.meta ? JSON.parse(this.meta).isLargeData : false
  }

  get showMaxLen() {
    return SHOW_MAX_LENGTH
  }

  private hightlightJSON() {
    if (this.jsonHighlight === false) {
      return
    }
    try {
      if (this.payload && ['JSON', 'CBOR', 'MsgPack'].includes(this.msgType) && !this.msgError) {
        this.hightlight = true
        this.$nextTick(() => {
          Prism.highlightAllUnder(this.$refs.msgLeftItem as HTMLElement)
        })
      }
    } catch (e) {
      this.hightlight = false
    }
  }

  private handleShowFullMsg() {
    this.showFullMsg = true
  }

  private mounted() {
    this.hightlightJSON()
  }
}
</script>

<style lang="scss">
body.light {
  @import '@/assets/scss/theme/custom/prism-one-light.scss';
}
body.dark,
body.night {
  @import '@/assets/scss/theme/custom/prism-one-dark.scss';
}
@import '~@/assets/scss/mixins.scss';

.msg-left-item {
  @include msg-item;
  text-align: left;
  position: relative;
  .msg-tag:nth-child(2) {
    margin-top: 2px;
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
  .large-message {
    .el-button.see-more-btn {
      margin-top: 6px;
      background: transparent;
      color: var(--color-text-left_info);
      border: 1px solid var(--color-text-left_info);
      &:hover {
        background: transparent;
        color: var(--color-text-default);
      }
    }
  }
}
</style>
