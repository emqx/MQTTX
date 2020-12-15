<template>
  <div ref="messageListBox" class="message-list messages-display" :style="{ height: `${height}px` }">
    <span v-show="showLoadingIcon" class="loading-icon"><i class="el-icon-loading"></i></span>
    <div v-for="message in showMessages" :key="message.mid" :id="message.mid">
      <MsgLeftItem
        v-if="!message.out"
        :subsList="subscriptions"
        v-bind="message"
        @showmenu="handleShowContextMenu(arguments, message)"
      />
      <MsgRightItem v-else v-bind="message" @showmenu="handleShowContextMenu(arguments, message)" />
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { MessageModel } from '@/views/connections/types'
import MsgRightItem from '@/components/MsgRightItem.vue'
import MsgLeftItem from '@/components/MsgLeftItem.vue'

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

  private showMessages: MessageModel[] = []
  private scrollTop: number = -1
  private showLoadingIcon: boolean = false
  private onceAddMessagesMaxNum: number = 20

  @Watch('messages')
  private handleMessagesChanged(val: MessageModel[]) {
    if (val.length) {
      const allMessages = _.cloneDeep(val)
      this.showMessages =
        allMessages.length >= this.onceAddMessagesMaxNum ? allMessages.slice(-this.onceAddMessagesMaxNum) : allMessages
    } else {
      this.showMessages = []
    }
  }

  @Watch('scrollTop')
  private handleScrollTopChanged(val: number, oldVal: number) {
    if (val === 0) {
      const allMessages = _.cloneDeep(this.messages)
      const [...showMessages] = this.showMessages
      const newMessages = allMessages.filter((item) => showMessages.every((one) => one.mid !== item.mid))
      const addMessages =
        newMessages.length >= this.onceAddMessagesMaxNum ? newMessages.slice(-this.onceAddMessagesMaxNum) : newMessages

      if (addMessages.length > 0) {
        this.showLoadingIcon = true
        const timer = setTimeout(() => {
          this.showMessages = addMessages.concat(this.showMessages)
          this.$nextTick(() => {
            if (addMessages.length > 0) {
              const id = addMessages[addMessages.length - 1].mid
              const idBox = document.getElementById(id)
              if (idBox) {
                idBox.scrollIntoView(true)
              }
              this.showLoadingIcon = false
            }
          })
          clearTimeout(timer)
        }, 1000)
      }
    }
  }

  private handleShowContextMenu(msgItemInfo: IArguments, message: MessageModel) {
    this.$emit('showContextMenu', msgItemInfo, message)
  }

  private getScrollBox() {
    const scrollBox = this.$refs.messageListBox as Element
    return scrollBox
  }

  private getScrollOffsetToTop() {
    const { scrollTop } = this.getScrollBox()
    this.scrollTop = scrollTop
  }

  private mounted() {
    this.getScrollBox().addEventListener('scroll', this.getScrollOffsetToTop)
  }

  private beforeDestroy() {
    this.getScrollBox().removeEventListener('scroll', this.getScrollOffsetToTop)
  }
}
</script>

<style lang="scss">
.message-list {
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 0 16px;
  margin-top: 19px;

  .loading-icon {
    display: inline-block;
    width: 100%;
    margin-top: 4px;
    text-align: center;
    font-size: 14px;
    color: var(--color-main-green);
  }
}
</style>
