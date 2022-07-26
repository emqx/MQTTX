<template>
  <div class="msg-right-item">
    <div class="right-payload payload">
      <p class="right-info">
        <span class="topic">Topic: {{ topic }}</span>
        <span class="qos">QoS: {{ qos }}</span>
      </p>
      <pre>{{ payload }}</pre>
    </div>
    <p class="right-time time">{{ createAt }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class MsgrightItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public qos!: number
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public createAt!: string
}
</script>

<style lang="scss" scoped>
@import '~@/assets/scss/mixins.scss';

.msg-right-item {
  text-align: right;
  @include msg-item;
  .right-payload {
    color: var(--color-text-active);
    background: var(--color-text-right_block);
    border-radius: 10px 0 10px 10px;
    text-align: left;
  }
  .right-payload,
  .right-time {
    position: relative;
    left: 0px;
    animation: rightMsg 0.3s ease-in-out;
  }
}
</style>
