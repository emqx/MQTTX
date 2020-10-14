<template>
  <div class="msg-right-item">
    <div class="right-payload payload" @contextmenu.prevent="customMenu($event)">
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

  private customMenu(event: MouseEvent) {
    this.$emit('showmenu', this.payload, event)
  }
}
</script>

<style lang="scss" scoped>
@import '~@/assets/scss/mixins.scss';

.msg-right-item {
  text-align: right;
  @include msg-item;
  .right-payload {
    color: #fff;
    background: var(--color-text-right_block);
    border-radius: 10px 0 10px 10px;
    text-align: left;
  }
}
</style>
