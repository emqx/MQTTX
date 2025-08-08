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
        <span class="topic">Topic: <span v-html="highlightedTopic"></span></span>
        <span class="qos">QoS: {{ qos }}</span>
        <span v-if="retain" class="retain">Retained</span>
      </p>
      <MqttProperties class="meta" :properties="properties" direction="left" />
      <template v-if="isLargeMsg">
        <div class="large-message">
          <pre v-html="highlightedPayloadPreview"></pre>
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
        <pre v-if="!highlight && !searchParams.payload">{{ highlightedPayload }}</pre>
        <pre v-else-if="!highlight" v-html="highlightedPayload"></pre>
        <pre v-else ref="highlightedCode"><code class="language-js">{{ payload }}</code></pre>
      </template>
    </div>
    <p class="left-time time">{{ createAt }}</p>
    <FullMsgDialog v-if="showFullMsg" :visible.sync="showFullMsg" :msgId="msgId" :msgType="msgType" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import FullMsgDialog from './FullMsgDialog.vue'
import Prism from 'prismjs'
import { Getter } from 'vuex-class'
import { SHOW_MAX_LENGTH } from '@/utils/data'
import MqttProperties from './MqttProperties.vue'
import { highlightSearchTerm, highlightInPrismCode } from '@/utils/highlightSearch'

@Component({
  components: {
    FullMsgDialog,
    MqttProperties,
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
  @Prop({ required: false, default: () => ({ topic: '', payload: '' }) }) public searchParams!: {
    topic: string
    payload: string
  }

  @Getter('jsonHighlight') private jsonHighlight!: boolean
  @Getter('currentTheme') private theme!: Theme

  public highlight: boolean = false

  private showFullMsg: boolean = false

  @Watch('searchParams', { deep: true })
  private onSearchParamsChanged() {
    this.$nextTick(() => {
      this.applyHighlighting()
    })
  }

  get highlightedTopic(): string {
    if (this.searchParams.topic) {
      return highlightSearchTerm(this.topic, this.searchParams.topic, 'search-highlight')
    }
    return this.topic
  }

  get highlightedPayload(): string {
    if (this.searchParams.payload) {
      return highlightSearchTerm(this.payload, this.searchParams.payload, 'search-highlight')
    }
    return this.payload
  }

  get highlightedPayloadPreview(): string {
    const preview = this.payload.substr(0, this.showMaxLen)
    if (this.searchParams.payload) {
      return highlightSearchTerm(preview, this.searchParams.payload, 'search-highlight')
    }
    return preview
  }

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

  private applyHighlighting() {
    if (this.highlight && this.searchParams.payload) {
      const codeElement = this.$refs.highlightedCode as HTMLElement
      if (codeElement) {
        this.clearHighlights(codeElement)
        highlightInPrismCode(codeElement, this.searchParams.payload, 'search-highlight')
      }
    }
  }

  private clearHighlights(element: HTMLElement) {
    const highlights = element.querySelectorAll('.search-highlight')
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
        parent.normalize()
      }
    })
  }

  private highlightJSON() {
    if (this.jsonHighlight === false) {
      return
    }
    try {
      if (this.payload && ['JSON', 'CBOR', 'MsgPack'].includes(this.msgType) && !this.msgError) {
        this.highlight = true
        this.$nextTick(() => {
          Prism.highlightAllUnder(this.$refs.msgLeftItem as HTMLElement)
          this.applyHighlighting()
        })
      }
    } catch (e) {
      this.highlight = false
    }
  }

  private handleShowFullMsg() {
    this.showFullMsg = true
  }

  private mounted() {
    this.highlightJSON()
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
  .search-highlight {
    background-color: #ffeb3b !important;
    color: #000 !important;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: bold;
  }
}
</style>
