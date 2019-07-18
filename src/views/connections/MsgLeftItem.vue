<template>
  <div class="msg-left-item">
    <p class="left-topic">{{ topic }}</p>
    <div class="left-payload payload">
      <pre>{{ payload }}</pre>
    </div>
    <p class="left-time time">{{ time }}</p>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class MsgLeftItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public time!: string
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
