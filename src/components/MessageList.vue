<template>
  <div
    ref="messageListBox"
    :class="['message-list', 'messages-display', isScrolling ? 'scrolling' : 'still']"
    :style="{ height: `${height}px`, marginTop: `${marginTop}px` }"
  >
    <span v-show="showLoadingIcon" class="loading-icon"><i class="el-icon-loading"></i></span>
    <template>
      <DynamicScroller v-if="showMessages.length" :items="showMessages" :min-item-size="20" class="scroller">
        <template v-slot="{ item, active }">
          <DynamicScrollerItem :item="item" :active="active" :data-index="item.id">
            <MsgLeftItem v-if="!item.out" v-bind="item" @showmenu="handleShowContextMenu(arguments, item)" />
            <MsgRightItem v-else v-bind="item" @showmenu="handleShowContextMenu(arguments, item)" />
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </template>
    <span v-show="showLoadingIcon" class="loading-icon after"><i class="el-icon-loading"></i></span>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MsgRightItem from '@/components/MsgRightItem.vue'
import MsgLeftItem from '@/components/MsgLeftItem.vue'
import { DynamicScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { matchTopicMethod } from '@/utils/topicMatch'

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
    DynamicScroller,
  },
})
export default class MessageList extends Vue {
  @Prop({ required: true }) messages!: MessageModel[]
  @Prop({ required: true }) height!: number
  @Prop({ required: true }) subscriptions!: SubscriptionModel[]
  @Prop({ required: true }) marginTop!: number

  public showMessages: MessageModel[] = []
  private showLoadingIcon: boolean = false
  private scrollOffset: { offset: number; mode: 'before' | 'after' } = {
    offset: Number.MAX_SAFE_INTEGER,
    mode: 'before',
  }
  private scrollOffsetMaxNum: number = 100
  private isScrolling = false
  private timeout: undefined | number = undefined

  @Watch('messages')
  private handleMessagesChanged(val: MessageModel[]) {
    this.showMessages = this.getMessageMatchColor(val)
  }

  @Watch('scrollOffset')
  private async handleScrollOffsetChanged(val: MessageList['scrollOffset'], oldVal: MessageList['scrollOffset']) {
    if (this.showLoadingIcon === false && val.offset === 0) {
      this.$emit(
        'getMoreMsg',
        val.mode,
        () => {
          this.showLoadingIcon = true
        },
        () => {
          this.showLoadingIcon = false
        },
      )
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
    if (scrollTop <= this.scrollOffsetMaxNum) {
      this.scrollOffset = { offset: scrollTop, mode: 'before' }
    } else if (scrollBottom <= this.scrollOffsetMaxNum) {
      this.scrollOffset = { offset: scrollBottom, mode: 'after' }
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
  .vue-recycle-scroller.scroller.ready.direction-vertical {
    overflow-y: visible;
    .vue-recycle-scroller__item-wrapper {
      overflow: visible;
    }
  }
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
    display: inline-block;
    width: 100%;
    margin-top: 6px;
    text-align: center;
    font-size: 14px;
    color: var(--color-main-green);
    &.after {
      margin-top: 0;
      margin-bottom: 6px;
    }
  }
}
</style>
