<template>
  <div
    ref="messageListBox"
    :class="['message-list', 'messages-display', isScrolling ? 'scrolling' : 'still']"
    :style="{ height: `${height}px`, marginTop: `${marginTop}px` }"
  >
    <span v-show="showBeforeLoadingIcon" class="loading-icon"><i class="el-icon-loading"></i></span>
    <div v-if="showMessages.length" class="scroller">
      <template v-for="item in showMessages">
        <MsgLeftItem
          v-if="!item.out"
          :key="item.id"
          :msgId="item.id"
          v-bind="item"
          @showmenu="handleShowContextMenu(arguments, item)"
        />
        <MsgRightItem v-else :key="item.id" v-bind="item" @showmenu="handleShowContextMenu(arguments, item)" />
      </template>
    </div>
    <span v-show="showAfterLoadingIcon" class="loading-icon after"><i class="el-icon-loading"></i></span>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MsgRightItem from '@/components/MsgRightItem.vue'
import MsgLeftItem from '@/components/MsgLeftItem.vue'
import { matchTopicMethod } from '@/utils/topicMatch'
import { SCROLL_OFFSET_MAX_NUM } from '@/utils/constant'

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
  },
})
export default class MessageList extends Vue {
  @Prop({ required: true }) messages!: MessageModel[]
  @Prop({ required: true }) height!: number
  @Prop({ required: true }) subscriptions!: SubscriptionModel[]
  @Prop({ required: true }) marginTop!: number

  public showMessages: MessageModel[] = []
  public showBeforeLoadingIcon: boolean = false
  public showAfterLoadingIcon: boolean = false
  public loadSwitch = true
  private scrollOffset: { offset: number; mode: 'before' | 'after' } = {
    offset: Number.MAX_SAFE_INTEGER,
    mode: 'before',
  }
  private isScrolling = false
  private timeout: undefined | number = undefined

  @Watch('messages', { deep: true })
  private handleMessagesChanged(val: MessageModel[]) {
    this.showMessages = this.getMessageMatchColor(val)
  }

  @Watch('scrollOffset')
  private async handleScrollOffsetChanged(val: MessageList['scrollOffset'], oldVal: MessageList['scrollOffset']) {
    if (
      this.loadSwitch &&
      this.showBeforeLoadingIcon === false &&
      this.showAfterLoadingIcon === false &&
      val.offset === 0
    ) {
      this.$emit('loadMoreMsg', val.mode)
    }
  }

  private handleShowContextMenu(msgItemInfo: IArguments, message: MessageModel) {
    this.$emit('showContextMenu', msgItemInfo, message)
  }

  private getMessageMatchColor(messages: MessageModel[]): MessageModel[] {
    return messages.map((msg) => {
      const topic: SubscriptionModel | undefined = this.subscriptions.find((sub: SubscriptionModel) =>
        matchTopicMethod(sub.topic, msg.topic),
      )
      if (topic && topic.color) {
        return { ...msg, color: topic.color } as MessageModel
      }
      return { ...msg, color: '' } as MessageModel
    })
  }

  private getScrollBox() {
    return this.$refs.messageListBox as Element
  }

  private getScrollOffset() {
    this.isScrolling = true
    window.clearTimeout(this.timeout)
    this.timeout = undefined
    const { scrollTop, scrollHeight, clientHeight } = this.getScrollBox()
    const scrollBottom = scrollHeight - scrollTop - clientHeight
    if (scrollTop <= SCROLL_OFFSET_MAX_NUM) {
      this.scrollOffset = { offset: scrollTop, mode: 'before' }
    } else if (scrollBottom <= SCROLL_OFFSET_MAX_NUM) {
      this.scrollOffset = { offset: scrollBottom, mode: 'after' }
      this.$emit('hideNewMsgsTip')
    }
    if (this.timeout === undefined) {
      this.timeout = window.setTimeout(() => {
        this.isScrolling = false
        window.clearTimeout(this.timeout)
        this.timeout = undefined
      }, 3000)
    }
  }

  private mounted() {
    this.$nextTick(() => {
      const scrollRef = this.getScrollBox()
      scrollRef.addEventListener('scroll', _.throttle(this.getScrollOffset, 200))
    })
  }

  private beforeDestroy() {
    this.getScrollBox().removeEventListener('scroll', this.getScrollOffset)
    window.clearTimeout(this.timeout)
  }
}
</script>

<style lang="scss">
.message-list {
  padding: 0 16px;
  overflow-x: hidden;
  overflow-y: overlay;
  &.scrolling {
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      width: 8px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 4px;
      background: var(--color-bg-scrollbar);
      width: 8px;
    }
  }
  &.still {
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .loading-icon {
    position: absolute;
    top: 6px;
    display: inline-block;
    width: 100%;
    text-align: center;
    font-size: 14px;
    color: var(--color-main-green);
    &.after {
      top: unset;
      bottom: 6px;
    }
  }
}
</style>
