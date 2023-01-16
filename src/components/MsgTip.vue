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
  color: #fff;
  border: none;
  padding: 8px 16px;
  box-shadow: #00000011 0px 4px 8px, #0000002e 0px 4px 8px;
  background: var(--color-bg-btn-gradient);
}
</style>
