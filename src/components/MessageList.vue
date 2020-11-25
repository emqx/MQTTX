<template>
  <div class="message-list messages-display" :style="{ height: `${height}px` }">
    <div v-for="message in messages" :key="message.mid">
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

  private handleShowContextMenu(msgItemInfo: IArguments, message: MessageModel) {
    this.$emit('showContextMenu', msgItemInfo, message)
  }
}
</script>

<style lang="scss">
.message-list {
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 0 16px;
  margin-top: 19px;
}
</style>
