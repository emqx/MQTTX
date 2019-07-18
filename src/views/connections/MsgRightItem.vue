<template>
  <div class="msg-right-item">
    <p class="right-topic">{{ topic }}</p>
    <div class="right-payload payload">
      <pre>{{ payload }}</pre>
    </div>
    <p class="right-time time">{{ time }}</p>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class MsgrightItem extends Vue {
  @Prop({ required: true }) public topic!: string
  @Prop({ required: true }) public payload!: string
  @Prop({ required: true }) public time!: string
}
</script>


<style lang="scss" scoped>
@import "~@/assets/scss/mixins.scss";

.msg-right-item {
  text-align: right;
  @include msg-item;
  .right-payload {
    color: #fff;
    background: var(--color-main-green);
    border-radius: 12px 0 12px 12px;
    text-align: left;
  }
}
</style>
