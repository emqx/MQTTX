<template>
  <div class="msg-type-tabs">
    <a :class="['msg-type-item', { active: value === 'all' }]" href="javascript:;" @click="changeValue('all')">{{
      $t('connections.all')
    }}</a>
    <a
      :class="['msg-type-item', { active: value === 'received' }]"
      href="javascript:;"
      @click="changeValue('received')"
      >{{ $t('connections.received') }}</a
    >
    <a
      :class="['msg-type-item', { active: value === 'publish' }]"
      href="javascript:;"
      @click="changeValue('publish')"
      >{{ $t('connections.published') }}</a
    >
  </div>
</template>

<script lang="ts">
import { Component, Vue, Model } from 'vue-property-decorator'
import { MessageType } from '@/views/connections/types'

@Component
export default class ResizeHeight extends Vue {
  @Model('change', { type: String }) private readonly value!: MessageType

  private changeValue(val: MessageType) {
    this.$emit('change', val)
  }
}
</script>

<style lang="scss">
.msg-type-tabs {
  .msg-type-item {
    padding-right: 12px;
    padding-left: 12px;
    color: var(--color-text-default);
    border-right: 1px solid var(--color-border-default);
    font-size: 12px;
    &:last-child {
      border-right: none;
      padding-right: 0px;
    }
    &.active {
      color: var(--color-main-green);
    }
  }
}
</style>
