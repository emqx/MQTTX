<template>
  <div class="msg-left-item">
    <span class="topic-color" :style="{ background: color }"></span>
    <div ref="leftPayload" class="left-payload payload" @contextmenu.prevent="customMenu($event)">
      <p class="left-info">
        <span class="topic">Topic: {{ topic }}</span>
        <span class="qos">QoS: {{ qos }}</span>
        <span v-if="retain" class="retain">Retain</span>
      </p>
      <div v-if="properties.userProperties">
        <span>UserProps: {{ properties.userProperties }}</span>
      </div>
      <pre>{{ payload }}</pre>
    </div>
    <p class="left-time time">{{ createAt }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class MsgLeftItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public qos!: number
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public createAt!: string
  @Prop({ required: false }) public retain!: boolean
  @Prop({ required: false }) public properties!: PushPropertiesModel
  @Prop({ required: false, default: '' }) public color!: string

  private customMenu(event: MouseEvent) {
    this.$emit('showmenu', this.payload, event)
  }
}
</script>

<style lang="scss" scoped>
@import '~@/assets/scss/mixins.scss';

.msg-left-item {
  @include msg-item;
  text-align: left;
  position: relative;
  .topic-color {
    height: calc(100% - 44px);
    display: inline-block;
    width: 4px;
    position: absolute;
    top: 11px;
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
  // TODO: replace keyframes animation in vue-scroller
  // @keyframes leftMsg {
  //   from {
  //     right: 171px;
  //   }
  //   to {
  //     right: 0px;
  //   }
  // }
}
</style>
