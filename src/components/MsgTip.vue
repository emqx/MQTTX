<template>
  <el-button v-if="count > 0" class="primary-btn new-msg-tip" icon="el-icon-bottom" @click="handleClick">
    {{ $tc('common.newMsg', count, { count }) }}
  </el-button>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class MsgTip extends Vue {
  @Prop({ required: false, default: 0 }) public count!: number

  private handleClick() {
    this.$emit('loadNewMsg')
  }
}
</script>

<style lang="scss" scoped>
@import '~@/assets/scss/mixins.scss';

.new-msg-tip {
  cursor: pointer;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-main-green);
  border-radius: 10px;
  border: 1px solid var(--color-border-default);
  padding: 10px 16px;
  box-shadow: var(--color-shadow-card) 2px 4px 6px;
  background: var(--color-bg-normal);
}
</style>
