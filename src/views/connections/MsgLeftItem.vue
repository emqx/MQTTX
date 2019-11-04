<template>
  <div class="msg-left-item">
    <div class="left-payload payload">
      <p class="left-info">
        <span class="topic">Topic: {{ topic }}</span>
        <span class="qos">QoS: {{ qos }}</span>
      </p>
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
}
</script>


<style lang="scss" scoped>
@import "~@/assets/scss/mixins.scss";

.msg-left-item {
  text-align: left;
  @include msg-item;
  .left-payload {
    background: var(--color-main-grey);
    border-radius: 0px 12px 12px 12px;
  }
}
</style>
